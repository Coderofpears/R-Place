export default class API {
	apiBase: string;

	constructor(apiBase: string) {
		this.apiBase = apiBase;
	}

	async get(endpoint: string) {
		try {
			const response = await fetch(this.apiBase + endpoint, {
				headers: {
					Accept: "application/json"
				},
				credentials: "include"
			});

			return await response.json();
		} catch (e) {
			return {
				message: {
					text: "Failed to fetch"
				},
				status: 500
			};
		}
	}

	async getPlaintext(endpoint: string) {
		try {
			const response = await fetch(this.apiBase + endpoint, {
				headers: {
					Accept: "application/json"
				},
				credentials: "include"
			});

			return await response.text();
		} catch (e) {
			return "";
		}
	}

	async post(endpoint: string, data: any) {
		try {
			const response = await fetch(this.apiBase + endpoint, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(data),
				credentials: "include"
			});

			return await response.json();
		} catch (e) {
			return {
				message: {
					text: "Failed to fetch"
				},
				status: 500
			};
		}
	}

	async postPlaintext(endpoint: string, data: string) {
		try {
			const response = await fetch(this.apiBase + endpoint, {
				method: "POST",
				headers: {
					Accept: "text/plain",
					"Content-Type": "text/plain"
				},
				body: data,
				credentials: "include"
			});

			return await response.text();
		} catch (e) {
			return {
				message: {
					text: "Failed to fetch"
				},
				status: 500
			};
		}
	}

	async postPlaintextWithJSONRequestBody(endpoint: string, data: any) {
		try {
			const response = await fetch(this.apiBase + endpoint, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json"
				},
				body: JSON.stringify(data),
				credentials: "include"
			});

			return await response.text();
		} catch (e) {
			return {
				message: {
					text: "Failed to fetch"
				},
				status: 500
			};
		}
	}
}
