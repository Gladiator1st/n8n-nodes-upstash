import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class UpstashVector implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstash Vector',
		name: 'upstashVector',
		icon: 'file:upstash.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Upstash Serverless Vector Database directly (Upsert, Query, Fetch, Delete)',
		usableAsTool: true,
		defaults: {
			name: 'Upstash Vector',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'upstashVectorApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Index',
						value: 'index',
					},
					{
						name: 'Vector',
						value: 'vector',
					},
				],
				default: 'vector',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['vector'],
					},
				},
				options: [
					{
						name: 'Create or Update',
						value: 'upsert',
						description: 'Create a new record, or update the current one if it already exists (upsert)',
						action: 'Upsert vector or text data',
					},
					{
						name: 'Delete by ID',
						value: 'delete',
						description: 'Delete vectors by ID or prefix',
						action: 'Delete vectors',
					},
					{
						name: 'Fetch by ID',
						value: 'fetch',
						description: 'Retrieve specific vectors by their IDs',
						action: 'Fetch vectors by ID',
					},
					{
						name: 'Query Similar',
						value: 'query',
						description: 'Search for nearest vectors or text embeddings',
						action: 'Query nearest vectors',
					},
				],
				default: 'query',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['index'],
					},
				},
				options: [
					{
						name: 'Get Info',
						value: 'info',
						description: 'Get index statistics, vector count, and dimensions',
						action: 'Get index info',
					},
					{
						name: 'Reset Index',
						value: 'reset',
						description: 'Delete all vectors from the index or namespace',
						action: 'Reset index',
					},
				],
				default: 'info',
			},

			// Fields for Upsert
			{
				displayName: 'Vector ID',
				name: 'vectorId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['upsert'],
					},
				},
				description: 'Unique identifier for the vector record',
			},
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Raw Text (Auto-Embed by Upstash)',
						value: 'text',
						description: 'Text string to be embedded automatically by Upstash',
					},
					{
						name: 'Vector Array (Float Array)',
						value: 'vectorArray',
						description: 'Raw embedding vector array e.g. [0.12, -0.45, ...]',
					},
				],
				default: 'text',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['upsert'],
					},
				},
			},
			{
				displayName: 'Text Data',
				name: 'textData',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['upsert'],
						inputType: ['text'],
					},
				},
				description: 'The text content to auto-embed and store',
			},
			{
				displayName: 'Vector Values',
				name: 'vectorValues',
				type: 'string',
				default: '',
				required: true,
				placeholder: '[0.024, -0.015, 0.432, ...]',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['upsert'],
						inputType: ['vectorArray'],
					},
				},
				description: 'JSON array of float numbers representing the vector',
			},
			{
				displayName: 'Metadata (JSON)',
				name: 'metadataJson',
				type: 'json',
				default: '{\n  "title": "Example Document",\n  "author": "User"\n}',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['upsert'],
					},
				},
				description: 'Arbitrary JSON metadata object to store with the vector',
			},
			{
				displayName: 'Namespace',
				name: 'namespace',
				type: 'string',
				default: '',
				placeholder: 'Optional namespace, e.g. production',
				description: 'Namespace to isolate data within your index',
			},

			// Fields for Query
			{
				displayName: 'Query Type',
				name: 'queryType',
				type: 'options',
				options: [
					{
						name: 'Search by Text (Auto-Embed)',
						value: 'text',
					},
					{
						name: 'Search by Vector Array',
						value: 'vectorArray',
					},
				],
				default: 'text',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['query'],
					},
				},
			},
			{
				displayName: 'Query Text',
				name: 'queryText',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['query'],
						queryType: ['text'],
					},
				},
				description: 'Text string to search for similar documents',
			},
			{
				displayName: 'Query Vector',
				name: 'queryVector',
				type: 'string',
				default: '',
				required: true,
				placeholder: '[0.024, -0.015, 0.432, ...]',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['query'],
						queryType: ['vectorArray'],
					},
				},
				description: 'JSON float array to search for similar vectors',
			},
			{
				displayName: 'Top K',
				name: 'topK',
				type: 'number',
				default: 5,
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['query'],
					},
				},
				description: 'Number of top similar results to return',
			},
			{
				displayName: 'Filter Expression',
				name: 'filter',
				type: 'string',
				default: '',
				placeholder: 'status = "active"',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['query'],
					},
				},
				description: 'Metadata filter string e.g. category = "news"',
			},
			{
				displayName: 'Include Metadata & Data',
				name: 'includeData',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['query'],
					},
				},
				description: 'Whether to include metadata and original data text in results',
			},

			// Fields for Fetch & Delete
			{
				displayName: 'Vector IDs (Comma-Separated)',
				name: 'vectorIds',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'id_1, id_2, id_3',
				displayOptions: {
					show: {
						resource: ['vector'],
						operation: ['fetch', 'delete'],
					},
				},
				description: 'Comma-separated list of vector IDs',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('upstashVectorApi');
		const baseUrl = (credentials.url as string).replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const namespace = this.getNodeParameter('namespace', i, '') as string;

				if (resource === 'vector') {
					if (operation === 'upsert') {
						const vectorId = this.getNodeParameter('vectorId', i) as string;
						const inputType = this.getNodeParameter('inputType', i) as string;
						const metadataRaw = this.getNodeParameter('metadataJson', i, {}) as any;

						let metadata = metadataRaw;
						if (typeof metadataRaw === 'string') {
							try {
								metadata = JSON.parse(metadataRaw);
							} catch (e) {
								metadata = {};
							}
						}

						const payload: Record<string, any> = {
							id: vectorId,
							metadata,
						};

						let endpoint = `${baseUrl}/upsert-data`;

						if (inputType === 'text') {
							payload.data = this.getNodeParameter('textData', i) as string;
						} else {
							const vectorRaw = this.getNodeParameter('vectorValues', i) as string;
							payload.vector = typeof vectorRaw === 'string' ? JSON.parse(vectorRaw) : vectorRaw;
							endpoint = `${baseUrl}/upsert`;
						}

						if (namespace) endpoint += `?namespace=${encodeURIComponent(namespace)}`;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashVectorApi',
							{
								url: endpoint,
								method: 'POST',
								body: payload,
								json: true,
							},
						);

						returnData.push({ json: { success: true, result: response.result || response }, pairedItem: { item: i } });
					} else if (operation === 'query') {
						const queryType = this.getNodeParameter('queryType', i) as string;
						const topK = this.getNodeParameter('topK', i, 5) as number;
						const filter = this.getNodeParameter('filter', i, '') as string;
						const includeData = this.getNodeParameter('includeData', i, true) as boolean;

						const queryPayload: Record<string, any> = {
							topK,
							includeMetadata: includeData,
							includeData,
						};

						if (namespace) queryPayload.namespace = namespace;
						if (filter) queryPayload.filter = filter;

						let endpoint = `${baseUrl}/query-data`;

						if (queryType === 'text') {
							queryPayload.data = this.getNodeParameter('queryText', i) as string;
						} else {
							const vectorRaw = this.getNodeParameter('queryVector', i) as string;
							queryPayload.vector = typeof vectorRaw === 'string' ? JSON.parse(vectorRaw) : vectorRaw;
							endpoint = `${baseUrl}/query`;
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashVectorApi',
							{
								url: endpoint,
								method: 'POST',
								body: queryPayload,
								json: true,
							},
						);

						const results = (response.result || response) as any[];
						for (const res of results) {
							returnData.push({ json: res, pairedItem: { item: i } });
						}
					} else if (operation === 'fetch') {
						const vectorIdsRaw = this.getNodeParameter('vectorIds', i) as string;
						const ids = vectorIdsRaw.split(',').map((id) => id.trim()).filter(Boolean);

						let endpoint = `${baseUrl}/fetch?ids=${encodeURIComponent(ids.join(','))}`;
						if (namespace) endpoint += `&namespace=${encodeURIComponent(namespace)}`;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashVectorApi',
							{
								url: endpoint,
								method: 'GET',
								json: true,
							},
						);

						const results = (response.result || response) as any[];
						for (const res of results) {
							returnData.push({ json: res, pairedItem: { item: i } });
						}
					} else if (operation === 'delete') {
						const vectorIdsRaw = this.getNodeParameter('vectorIds', i) as string;
						const ids = vectorIdsRaw.split(',').map((id) => id.trim()).filter(Boolean);

						let endpoint = `${baseUrl}/delete`;
						if (namespace) endpoint += `?namespace=${encodeURIComponent(namespace)}`;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashVectorApi',
							{
								url: endpoint,
								method: 'DELETE',
								body: { ids },
								json: true,
							},
						);

						returnData.push({ json: { success: true, result: response.result || response }, pairedItem: { item: i } });
					}
				} else if (resource === 'index') {
					if (operation === 'info') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashVectorApi',
							{
								url: `${baseUrl}/info`,
								method: 'GET',
								json: true,
							},
						);
						returnData.push({ json: response.result || response, pairedItem: { item: i } });
					} else if (operation === 'reset') {
						let endpoint = `${baseUrl}/reset`;
						if (namespace) endpoint += `?namespace=${encodeURIComponent(namespace)}`;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashVectorApi',
							{
								url: endpoint,
								method: 'DELETE',
								json: true,
							},
						);
						returnData.push({ json: { success: true, result: response.result || response }, pairedItem: { item: i } });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
