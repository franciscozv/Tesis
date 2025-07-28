const handleResponse = async (response: Response) => {
	if (response.ok) {
		if (response.status === 204) {
			return null;
		}
		return response.json();
	} else {
		let errorData: any;
		try {
			errorData = await response.json();
		} catch (e) {
			errorData = { message: `Error desconocido. Status: ${response.status}` };
		}
		throw new Error(
			errorData.message || `Error en la solicitud: ${response.statusText}`,
		);
	}
};

export const get = async (url: string) => {
	const response = await fetch(url);
	return handleResponse(response);
};

export const post = async (url: string, data: any, isFormData = false) => {
	const options: RequestInit = {
		method: "POST",
	};

	if (isFormData) {
		options.body = data;
	} else {
		options.headers = {
			"Content-Type": "application/json",
		};
		options.body = JSON.stringify(data);
	}

	const response = await fetch(url, options);
	return handleResponse(response);
};

export const put = async (url: string, data: any) => {
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	return handleResponse(response);
};

export const patch = async (url: string, data: any) => {
	const response = await fetch(url, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
	return handleResponse(response);
};

export const del = async (url: string) => {
	const response = await fetch(url, {
		method: "DELETE",
	});
	return handleResponse(response);
};
