import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class UpstashQStash implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Upstash QStash',
		name: 'upstashQStash',
		icon: { light: 'file:upstash.svg', dark: 'file:upstash.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Serverless HTTP Message Queue, Delayed Webhook Scheduler & Cron Runner',
		usableAsTool: true,
		defaults: {
			name: 'Upstash QStash',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'upstashQStashApi',
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

			// Fields for Publish
			{
				displayName: 'Destination URL',
				name: 'destinationUrl',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://your-n8n-instance.com/webhook/reminder',
				displayOptions: {
					show: {
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
						operation: ['publish'],
					},
				},
				description: 'Messages with the same deduplication ID within the window will be dropped',
			},

			// Fields for Schedule
			{
				displayName: 'Cron Expression',
				name: 'cron',
				type: 'string',
				default: '0 9 * * 1',
				required: true,
				placeholder: '*/5 * * * * or 0 9 * * 1',
				displayOptions: {
					show: {
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
						operation: ['deleteSchedule'],
					},
				},
				description: 'The unique QStash schedule ID to delete',
			},

			// Fields for Cancel Message
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
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
		const baseUrl = 'https://qstash.upstash.io/v2';

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

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
