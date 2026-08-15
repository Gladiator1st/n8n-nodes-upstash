import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

interface UpstashVectorQueryResult {
	id: string;
	score: number;
	vector?: number[];
	data?: string;
	metadata?: Record<string, any>;
}

export class UpstashVectorStore implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstash Vector Store',
		name: 'upstashVectorStore',
		icon: { light: 'file:upstash.svg', dark: 'file:upstash.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["embeddingMode"]}}',
		description: 'Serverless Vector Store for n8n AI Agents and RAG workflows with built-in auto-embeddings support',
		usableAsTool: true,
		defaults: {
			name: 'Upstash Vector Store',
		},
		credentials: [
			{
				name: 'upstashVectorApi',
				required: true,
			},
		],
		inputs: `={{ [
			{
				type: "${NodeConnectionTypes.AiEmbedding}",
				name: "embedding",
				displayName: "Embedding Model",
				required: false,
				maxConnections: 1
			}
		] }}`,
		outputs: `={{ [
			{
				type: "${NodeConnectionTypes.AiVectorStore}",
				name: "vectorStore",
				displayName: "Vector Store"
			}
		] }}`,
		properties: [
			{
				displayName: 'Namespace',
				name: 'namespace',
				type: 'string',
				default: '',
				placeholder: 'Optional namespace, e.g. production',
				description: 'Namespace partitions within your Upstash Vector index',
			},
			{
				displayName: 'Embedding Mode',
				name: 'embeddingMode',
				type: 'options',
				options: [
					{
						name: 'External Embeddings Node',
						value: 'externalNode',
						description: 'Uses the connected n8n Embeddings model (e.g. OpenAI, Cohere)',
					},
					{
						name: 'Upstash Built-In Embedding (Server-Side)',
						value: 'upstashAuto',
						description: 'Uses Upstash auto-embedding configured in your Upstash index (No separate embedding key needed)',
					},
				],
				default: 'upstashAuto',
				description: 'Whether to use Upstash server-side embeddings or the connected n8n embeddings node',
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 4,
				description: 'Number of most similar documents to retrieve',
			},
			{
				displayName: 'Metadata Filter',
				name: 'filter',
				type: 'string',
				default: '',
				placeholder: 'category = "finance" AND status = "active"',
				description: 'SQL-like metadata filter expression for Upstash Vector',
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('upstashVectorApi');
		const baseUrl = (credentials.url as string).replace(/\/+$/, '');

		const namespace = this.getNodeParameter('namespace', itemIndex, '') as string;
		const embeddingMode = this.getNodeParameter('embeddingMode', itemIndex, 'upstashAuto') as string;
		const topK = this.getNodeParameter('topK', itemIndex, 4) as number;
		const filter = this.getNodeParameter('filter', itemIndex, '') as string;

		const embeddings = (await this.getInputConnectionData(NodeConnectionTypes.AiEmbedding, 0)) as any;

		const nodeContext = this;

		// Custom VectorStore implementation for n8n LangChain integration
		const vectorStore = {
			async similaritySearch(query: string, k = topK, customFilter = filter): Promise<any[]> {
				let requestBody: Record<string, any> = {
					topK: k,
					includeMetadata: true,
					includeData: true,
				};

				if (namespace) requestBody.namespace = namespace;
				if (customFilter) requestBody.filter = customFilter;

				let endpoint = `${baseUrl}/query-data`;

				if (embeddingMode === 'externalNode' && embeddings) {
					const queryVector = await embeddings.embedQuery(query);
					requestBody.vector = queryVector;
					endpoint = `${baseUrl}/query`;
				} else {
					requestBody.data = query;
				}

				const response = await nodeContext.helpers.httpRequestWithAuthentication.call(
					nodeContext,
					'upstashVectorApi',
					{
						url: endpoint,
						method: 'POST',
						body: requestBody,
						json: true,
					},
				);

				const results = (response.result || response) as UpstashVectorQueryResult[];
				return (results || []).map((r) => ({
					pageContent: r.data || (r.metadata && r.metadata.text) || r.id,
					metadata: {
						id: r.id,
						score: r.score,
						...(r.metadata || {}),
					},
				}));
			},

			async similaritySearchWithScore(query: string, k = topK, customFilter = filter): Promise<Array<[any, number]>> {
				const docs = await this.similaritySearch(query, k, customFilter);
				return docs.map((doc) => [doc, doc.metadata.score]);
			},

			async addDocuments(documents: any[]): Promise<string[]> {
				const ids: string[] = [];
				const isExternal = embeddingMode === 'externalNode' && embeddings;

				for (let i = 0; i < documents.length; i++) {
					const doc = documents[i];
					const id = doc.metadata?.id || `doc_${Date.now()}_${i}`;
					ids.push(id);

					const item: Record<string, any> = {
						id,
						metadata: doc.metadata || {},
					};

					let endpoint = `${baseUrl}/upsert-data`;

					if (isExternal) {
						item.vector = await embeddings.embedQuery(doc.pageContent);
						item.data = doc.pageContent;
						endpoint = `${baseUrl}/upsert`;
					} else {
						item.data = doc.pageContent;
					}

					if (namespace) {
						endpoint += `?namespace=${encodeURIComponent(namespace)}`;
					}

					await nodeContext.helpers.httpRequestWithAuthentication.call(
						nodeContext,
						'upstashVectorApi',
						{
							url: endpoint,
							method: 'POST',
							body: item,
							json: true,
						},
					);
				}

				return ids;
			},

			async asRetriever(k = topK, customFilter = filter) {
				return {
					getRelevantDocuments: async (query: string) => {
						return await this.similaritySearch(query, k, customFilter);
					},
				};
			},
		};

		return {
			response: vectorStore,
		};
	}
}
