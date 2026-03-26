// This script needs to be run in the console of an active Gimkit 2D game with Gimloader installed to work.

(function () {
	let state = GL.net.colyseus.room.serializer.state;

	function generateClass(name, schema) {
		let classStr = `class ${name} extends Schema {\n`;

		for (let key in schema._definition.schema) {
			let value = schema._definition.schema[key];

			if (typeof value === "string") {
				// primitive type, easy
				classStr += `    @type("${value}") ${key}: ${value};\n`;
				continue;
			}

			if (typeof value === "function") {
				// the schema is an object
				let className = key.charAt(0).toUpperCase() + key.slice(1);

				let subClassStr = generateClass(className, schema[key]);
				classStr = `${subClassStr}\n${classStr}`;

				classStr += `    @type(${className}) ${key}: ${className} = new ${className}();\n`;
				continue;
			}

			if (value.map) {
				let className = `${key.charAt(0).toUpperCase() + key.slice(1)}Item`;

				let item = schema[key].getByIndex(0);
				if (!item) {
					console.error(`Could not find item for ${className}`);
					continue;
				}

				let subClassStr = generateClass(className, item);
				classStr = `${subClassStr}\n${classStr}`;

				classStr += `    @type({ map: ${className} }) ${key} = new MapSchema<${className}>();\n`;
				continue;
			}

			if (value.array) {
				if (typeof value.array === "string") {
					classStr += `    @type([ "${value.array}" ]) ${key} = new ArraySchema<${value.array}>();\n`;
					continue;
				}

				let className = `${key.charAt(0).toUpperCase() + key.slice(1)}Item`;

				let item = schema[key].at(0);
				if (!item) {
					console.error(`Could not find item for ${className}`);
					continue;
				}

				let subClassStr = generateClass(className, item);
				classStr = `${subClassStr}\n${classStr}`;

				classStr += `    @type([ ${className} ]) ${key} = new ArraySchema<${className}>();\n`;
				continue;
			}

			console.error("Unknown type for key", key, value);
		}

		classStr += "}\n";

		return classStr;
	}

	console.log(generateClass("GimkitState", state));
})();
