import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Upstash implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstash',
		name: 'upstash',
		icon: { light: 'file:upstash.svg', dark: 'file:upstash.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with Upstash Serverless Vector Database, Redis Cache, and QStash Message Queue',
		usableAsTool: true,
		defaults: {
			name: 'Upstash',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'upstashVectorApi',
				required: true,
				displayOptions: {
					show: {
						resource: ['vector'],
					},
				},
			},
			{
				name: 'upstashRedisApi',
				required: true,
				displayOptions: {
					show: {
						resource: ['redis'],
					},
				},
			},
			{
				name: 'upstashQStashApi',
				required: true,
				displayOptions: {
					show: {
						resource: ['qstash'],
					},
				},
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
						name: 'Vector',
						value: 'vector',
						description: 'Serverless Vector database for embeddings, semantic similarity search, and RAG',
					},
					{
						name: 'Redis',
						value: 'redis',
						description: 'Serverless Redis Key-Value caching, JSON operations, and AI rate limiting',
					},
					{
						name: 'QStash',
						value: 'qstash',
						description: 'Serverless HTTP message queue, delayed webhooks, and cron scheduler',
					},
				],
				default: 'vector',
			},

			// ==========================================
			// Operations: Vector
			// ==========================================
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
						description: 'Create a new vector record, or update it if it already exists (auto-embeds text)',
						action: 'Upsert vector or text data',
					},
					{
						name: 'Delete by ID',
						value: 'delete',
						description: 'Delete vectors by ID',
						action: 'Delete vectors',
					},
					{
						name: 'Fetch by ID',
						value: 'fetch',
						description: 'Retrieve specific vectors by their IDs',
						action: 'Fetch vectors by ID',
					},
					{
						name: 'Get Info',
						value: 'info',
						description: 'Get index statistics, vector count, and dimensions',
						action: 'Get index info',
					},
					{
						name: 'Query Similar',
						value: 'query',
						description: 'Search for nearest vectors or text embeddings',
						action: 'Query nearest vectors',
					},
					{
						name: 'Reset Index',
						value: 'reset',
						description: 'Delete all vectors from the index or namespace',
						action: 'Reset index',
					},
				],
				default: 'query',
			},

			// ==========================================
			// Operations: Redis
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['redis'],
					},
				},
				options: [
					{
						name: 'AI Agent Rate Limiter',
						value: 'rateLimit',
						description: 'Sliding window rate-limiter to protect AI agent quotas and prevent loops',
						action: 'Rate limit requests',
					},
					{
						name: 'Delete Key(s)',
						value: 'delete',
						description: 'Delete one or more keys',
						action: 'Delete keys',
					},
					{
						name: 'Get Value',
						value: 'get',
						description: 'Get the string or JSON value of a key',
						action: 'Get value by key',
					},
					{
						name: 'Increment Counter',
						value: 'incr',
						description: 'Increment or decrement an integer counter',
						action: 'Increment counter',
					},
					{
						name: 'JSON Get',
						value: 'jsonGet',
						description: 'Get JSON value from key at specified JSON path',
						action: 'Get a JSON value',
					},
					{
						name: 'JSON Set',
						value: 'jsonSet',
						description: 'Set JSON value into key at specified JSON path',
						action: 'Set a JSON value',
					},
					{
						name: 'Set Value',
						value: 'set',
						description: 'Set string or JSON value of a key with optional TTL',
						action: 'Set value of a key',
					},
				],
				default: 'get',
			},

			// ==========================================
			// Operations: QStash
			// ==========================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['qstash'],
					},
				},
				options: [
					{
						name: 'Cancel Message',
						value: 'cancelMessage',
						description: 'Cancel a pending delayed message before it executes',
						action: 'Cancel message',
					},
					{
						name: 'Create Cron Schedule',
						value: 'createSchedule',
						description: 'Create a recurring cron schedule targeting a webhook/URL',
						action: 'Create cron schedule',
					},
					{
						name: 'Delete Schedule',
						value: 'deleteSchedule',
						description: 'Delete an active cron schedule by Schedule ID',
						action: 'Delete schedule',
					},
					{
						name: 'List Schedules',
						value: 'listSchedules',
						description: 'List all active QStash cron schedules',
						action: 'List schedules',
					},
					{
						name: 'Publish Message (With Delay/Queue)',
						value: 'publish',
						description: 'Publish an HTTP message to a destination URL with optional delay',
						action: 'Publish message',
					},
				],
				default: 'publish',
			},

			// ==========================================
			// Vector Parameter Fields
			// ==========================================
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
				displayOptions: {
					show: {
						resource: ['vector'],
					},
				},
				description: 'Namespace to isolate data within your index',
			},
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

			// ==========================================
			// Redis Parameter Fields
			// ==========================================
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['get', 'set', 'delete', 'incr', 'jsonGet', 'jsonSet'],
					},
				},
				description: 'The Redis key name',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['set'],
					},
				},
				description: 'String or text value to store',
			},
			{
				displayName: 'Expiration (TTL in Seconds)',
				name: 'ttlSeconds',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['set'],
					},
				},
				description: 'Optional time-to-live in seconds (0 for no expiration)',
			},
			{
				displayName: 'Increment Amount',
				name: 'incrementAmount',
				type: 'number',
				default: 1,
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['incr'],
					},
				},
				description: 'Amount to increment by (use negative numbers to decrement)',
			},
			{
				displayName: 'JSON Path',
				name: 'jsonPath',
				type: 'string',
				default: '$',
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['jsonGet', 'jsonSet'],
					},
				},
				description: 'JSONPath string (e.g. $ or $.user.name)',
			},
			{
				displayName: 'JSON Value',
				name: 'jsonValue',
				type: 'json',
				default: '{\n  "status": "success"\n}',
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['jsonSet'],
					},
				},
				description: 'JSON object or value to store',
			},
			{
				displayName: 'Rate Limit Identifier',
				name: 'identifier',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'user_123 or ip_address or global_agent',
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['rateLimit'],
					},
				},
				description: 'Unique identifier for the user, IP, or workflow to rate limit',
			},
			{
				displayName: 'Max Allowed Requests',
				name: 'maxRequests',
				type: 'number',
				default: 10,
				required: true,
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['rateLimit'],
					},
				},
				description: 'Maximum number of requests allowed in the window',
			},
			{
				displayName: 'Window Duration (Seconds)',
				name: 'windowSeconds',
				type: 'number',
				default: 60,
				required: true,
				displayOptions: {
					show: {
						resource: ['redis'],
						operation: ['rateLimit'],
					},
				},
				description: 'Duration of the sliding window in seconds (e.g. 60 for 1 minute)',
			},

			// ==========================================
			// QStash Parameter Fields
			// ==========================================
			{
				displayName: 'Destination URL',
				name: 'destinationUrl',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://your-n8n-instance.com/webhook/reminder',
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['publish', 'createSchedule'],
					},
				},
				description: 'The endpoint/webhook URL that QStash will call when the message is delivered',
			},
			{
				displayName: 'Payload Body',
				name: 'body',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '{\n  "event": "user_followup",\n  "userId": "12345"\n}',
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['publish', 'createSchedule'],
					},
				},
				description: 'The request body to deliver to the destination URL',
			},
			{
				displayName: 'Delay',
				name: 'delay',
				type: 'string',
				default: '',
				placeholder: '10s, 15m, 2h, 3d',
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['publish'],
					},
				},
				description: 'Delay duration before delivering message (e.g. 10s, 15m, 2h, 3d)',
			},
			{
				displayName: 'Retries on Failure',
				name: 'retries',
				type: 'number',
				default: 3,
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['publish', 'createSchedule'],
					},
				},
				description: 'Number of automatic retries with exponential backoff if destination fails',
			},
			{
				displayName: 'Deduplication ID',
				name: 'deduplicationId',
				type: 'string',
				default: '',
				placeholder: 'Optional unique ID for deduplication',
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['publish'],
					},
				},
				description: 'Messages with the same deduplication ID within the window will be dropped',
			},
			{
				displayName: 'Cron Expression',
				name: 'cron',
				type: 'string',
				default: '0 9 * * 1',
				required: true,
				placeholder: '*/5 * * * * or 0 9 * * 1',
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['createSchedule'],
					},
				},
				description: 'Standard 5-field cron expression for recurring execution',
			},
			{
				displayName: 'Schedule ID',
				name: 'scheduleId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['deleteSchedule'],
					},
				},
				description: 'The unique QStash schedule ID to delete',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['qstash'],
						operation: ['cancelMessage'],
					},
				},
				description: 'The unique QStash message ID to cancel',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'vector') {
					const credentials = await this.getCredentials('upstashVectorApi');
					const baseUrl = (credentials.url as string).replace(/\/+$/, '');
					const namespace = this.getNodeParameter('namespace', i, '') as string;

					if (operation === 'upsert') {
						const vectorId = this.getNodeParameter('vectorId', i) as string;
						const inputType = this.getNodeParameter('inputType', i) as string;
						const metadataRaw = this.getNodeParameter('metadataJson', i, {}) as any;

						let metadata = metadataRaw;
						if (typeof metadataRaw === 'string') {
							try {
								metadata = JSON.parse(metadataRaw);
							} catch (e) {
								// Keep raw metadata or empty object if not JSON
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
					} else if (operation === 'info') {
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
				} else if (resource === 'redis') {
					const credentials = await this.getCredentials('upstashRedisApi');
					const baseUrl = (credentials.url as string).replace(/\/+$/, '');

					if (operation === 'get') {
						const key = this.getNodeParameter('key', i) as string;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}/get/${encodeURIComponent(key)}`,
								method: 'GET',
								json: true,
							},
						);

						let parsedValue = response.result;
						try {
							parsedValue = JSON.parse(response.result);
						} catch (e) {
							// Keep raw string if not JSON
						}

						returnData.push({ json: { key, value: parsedValue }, pairedItem: { item: i } });
					} else if (operation === 'set') {
						const key = this.getNodeParameter('key', i) as string;
						const value = this.getNodeParameter('value', i) as string;
						const ttlSeconds = this.getNodeParameter('ttlSeconds', i, 0) as number;

						const command = ['SET', key, value];
						if (ttlSeconds > 0) {
							command.push('EX', ttlSeconds.toString());
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}`,
								method: 'POST',
								body: command,
								json: true,
							},
						);

						returnData.push({ json: { success: response.result === 'OK', result: response.result }, pairedItem: { item: i } });
					} else if (operation === 'delete') {
						const key = this.getNodeParameter('key', i) as string;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}/del/${encodeURIComponent(key)}`,
								method: 'GET',
								json: true,
							},
						);

						returnData.push({ json: { deletedCount: response.result || 0 }, pairedItem: { item: i } });
					} else if (operation === 'incr') {
						const key = this.getNodeParameter('key', i) as string;
						const amount = this.getNodeParameter('incrementAmount', i, 1) as number;

						const cmd = ['INCRBY', key, amount.toString()];
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}`,
								method: 'POST',
								body: cmd,
								json: true,
							},
						);

						returnData.push({ json: { key, newValue: response.result }, pairedItem: { item: i } });
					} else if (operation === 'jsonGet') {
						const key = this.getNodeParameter('key', i) as string;
						const jsonPath = this.getNodeParameter('jsonPath', i, '$') as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}`,
								method: 'POST',
								body: ['JSON.GET', key, jsonPath],
								json: true,
							},
						);

						let parsed = response.result;
						try {
							parsed = JSON.parse(response.result);
						} catch (e) {
							// Keep raw string if not JSON
						}

						returnData.push({ json: { key, jsonPath, data: parsed }, pairedItem: { item: i } });
					} else if (operation === 'jsonSet') {
						const key = this.getNodeParameter('key', i) as string;
						const jsonPath = this.getNodeParameter('jsonPath', i, '$') as string;
						const jsonRaw = this.getNodeParameter('jsonValue', i, {}) as any;

						const jsonString = typeof jsonRaw === 'string' ? jsonRaw : JSON.stringify(jsonRaw);

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}`,
								method: 'POST',
								body: ['JSON.SET', key, jsonPath, jsonString],
								json: true,
							},
						);

						returnData.push({ json: { success: response.result === 'OK', result: response.result }, pairedItem: { item: i } });
					} else if (operation === 'rateLimit') {
						const identifier = this.getNodeParameter('identifier', i) as string;
						const maxRequests = this.getNodeParameter('maxRequests', i, 10) as number;
						const windowSeconds = this.getNodeParameter('windowSeconds', i, 60) as number;

						const now = Date.now();
						const clearBefore = now - windowSeconds * 1000;
						const rateKey = `ratelimit:${identifier}`;

						// Atomic Pipeline using Upstash REST pipeline
						const pipeline = [
							['ZREMRANGEBYSCORE', rateKey, '0', clearBefore.toString()],
							['ZCARD', rateKey],
							['ZADD', rateKey, now.toString(), `${now}-${Math.random()}`],
							['EXPIRE', rateKey, windowSeconds.toString()],
						];

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashRedisApi',
							{
								url: `${baseUrl}/pipeline`,
								method: 'POST',
								body: pipeline,
								json: true,
							},
						);

						const currentCount = (response[1] && response[1].result) || 0;
						const allowed = currentCount < maxRequests;
						const remaining = Math.max(0, maxRequests - (currentCount + 1));

						returnData.push({
							json: {
								identifier,
								allowed,
								remaining,
								limit: maxRequests,
								windowSeconds,
								currentCount: currentCount + 1,
							},
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'qstash') {
					const baseUrl = 'https://qstash.upstash.io/v2';

					if (operation === 'publish') {
						const destinationUrl = this.getNodeParameter('destinationUrl', i) as string;
						const body = this.getNodeParameter('body', i, '') as string;
						const delay = this.getNodeParameter('delay', i, '') as string;
						const retries = this.getNodeParameter('retries', i, 3) as number;
						const deduplicationId = this.getNodeParameter('deduplicationId', i, '') as string;

						const headers: Record<string, string> = {
							'Content-Type': 'application/json',
							'Upstash-Retries': retries.toString(),
						};

						if (delay) headers['Upstash-Delay'] = delay;
						if (deduplicationId) headers['Upstash-Deduplication-Id'] = deduplicationId;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashQStashApi',
							{
								url: `${baseUrl}/publish/${destinationUrl}`,
								method: 'POST',
								headers,
								body,
								json: true,
							},
						);

						returnData.push({ json: response, pairedItem: { item: i } });
					} else if (operation === 'createSchedule') {
						const destinationUrl = this.getNodeParameter('destinationUrl', i) as string;
						const cron = this.getNodeParameter('cron', i) as string;
						const body = this.getNodeParameter('body', i, '') as string;
						const retries = this.getNodeParameter('retries', i, 3) as number;

						const headers: Record<string, string> = {
							'Content-Type': 'application/json',
							'Upstash-Cron': cron,
							'Upstash-Retries': retries.toString(),
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashQStashApi',
							{
								url: `${baseUrl}/schedules/${destinationUrl}`,
								method: 'POST',
								headers,
								body,
								json: true,
							},
						);

						returnData.push({ json: response, pairedItem: { item: i } });
					} else if (operation === 'listSchedules') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashQStashApi',
							{
								url: `${baseUrl}/schedules`,
								method: 'GET',
								json: true,
							},
						);

						const list = Array.isArray(response) ? response : [response];
						for (const item of list) {
							returnData.push({ json: item, pairedItem: { item: i } });
						}
					} else if (operation === 'deleteSchedule') {
						const scheduleId = this.getNodeParameter('scheduleId', i) as string;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashQStashApi',
							{
								url: `${baseUrl}/schedules/${encodeURIComponent(scheduleId)}`,
								method: 'DELETE',
								json: true,
							},
						);

						returnData.push({ json: { success: true, scheduleId, result: response }, pairedItem: { item: i } });
					} else if (operation === 'cancelMessage') {
						const messageId = this.getNodeParameter('messageId', i) as string;
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'upstashQStashApi',
							{
								url: `${baseUrl}/messages/${encodeURIComponent(messageId)}`,
								method: 'DELETE',
								json: true,
							},
						);

						returnData.push({ json: { success: true, messageId, result: response }, pairedItem: { item: i } });
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
