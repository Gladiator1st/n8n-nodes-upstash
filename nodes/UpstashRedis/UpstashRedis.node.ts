import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class UpstashRedis implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstash Redis',
		name: 'upstashRedis',
		icon: { light: 'file:upstash.svg', dark: 'file:upstash.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Serverless Redis Key-Value storage, JSON operations, and AI Agent Rate-Limiting over REST',
		usableAsTool: true,
		defaults: {
			name: 'Upstash Redis',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'upstashRedisApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
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

			// Fields for Get, Set, Delete, Incr
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
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
						operation: ['incr'],
					},
				},
				description: 'Amount to increment by (use negative numbers to decrement)',
			},

			// Fields for JSON operations
			{
				displayName: 'JSON Path',
				name: 'jsonPath',
				type: 'string',
				default: '$',
				displayOptions: {
					show: {
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
						operation: ['jsonSet'],
					},
				},
				description: 'JSON object or value to store',
			},

			// Fields for Rate Limiter
			{
				displayName: 'Rate Limit Identifier',
				name: 'identifier',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'user_123 or ip_address or global_agent',
				displayOptions: {
					show: {
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
						operation: ['rateLimit'],
					},
				},
				description: 'Duration of the sliding window in seconds (e.g. 60 for 1 minute)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('upstashRedisApi');
		const baseUrl = (credentials.url as string).replace(/\/+$/, '');

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

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

					let cmd = ['INCRBY', key, amount.toString()];
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
					} catch (e) {}

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
