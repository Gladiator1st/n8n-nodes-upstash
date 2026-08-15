import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class UpstashRedisApi implements ICredentialType {
	name = 'upstashRedisApi';
	displayName = 'Upstash Redis API';
	documentationUrl = 'https://upstash.com/docs/redis/overall/getstarted';
	icon = 'file:upstash.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'REST URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://your-db-name.upstash.io',
			required: true,
			description: 'The UPSTASH_REDIS_REST_URL from your Upstash Redis dashboard',
		},
		{
			displayName: 'REST Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'ABc123...',
			required: true,
			description: 'The UPSTASH_REDIS_REST_TOKEN from your Upstash Redis dashboard',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.token}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.url}}',
			url: '/ping',
			method: 'GET',
		},
	};
}
