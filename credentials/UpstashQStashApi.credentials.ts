import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class UpstashQStashApi implements ICredentialType {
	name = 'upstashQStashApi';
	displayName = 'Upstash QStash API';
	documentationUrl = 'https://upstash.com/docs/qstash/overall/getstarted';
	icon = 'file:upstash.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'QStash Token',
			name: 'token',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'ey...',
			required: true,
			description: 'The QSTASH_TOKEN from your Upstash QStash dashboard',
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
			baseURL: 'https://qstash.upstash.io',
			url: '/v2/schedules',
			method: 'GET',
		},
	};
}
