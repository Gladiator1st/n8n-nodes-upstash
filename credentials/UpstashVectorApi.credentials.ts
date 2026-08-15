import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class UpstashVectorApi implements ICredentialType {
	name = 'upstashVectorApi';
	displayName = 'Upstash Vector API';
	documentationUrl = 'https://upstash.com/docs/vector/overall/getstarted';
	icon = 'file:upstash.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'REST URL',
			name: 'url',
			type: 'string',
			default: '',
			placeholder: 'https://your-index-name.upstash.io',
			required: true,
			description: 'The UPSTASH_VECTOR_REST_URL from your Upstash Vector dashboard',
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
			description: 'The UPSTASH_VECTOR_REST_TOKEN from your Upstash Vector dashboard',
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
			url: '/info',
			method: 'GET',
		},
	};
}
