export function getConfig(): any {
	const configElement = document.getElementById(
		"librekit-config"
	) as HTMLScriptElement;

	if (configElement) {
		return JSON.parse(configElement.text);
	}

	return {};
}
