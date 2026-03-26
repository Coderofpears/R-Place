/**
 * @name CustomServer
 * @description Connect to a custom server
 * @author TheLazySquid
 * @version 0.1.0
 */

GL.parcel.interceptRequire(
	"CustomServer",
	(exports) => exports?.default?.toString?.().includes("this.interceptors="),
	(exports) => {
		let defaultClass = exports.default;

		delete exports.default;

		exports.default = class extends defaultClass {
			request(e, t) {
				if (e.url.startsWith("/api/matchmaker")) {
					e.url = `http://localhost:7857${e.url}`;
				}
				return super.request(e, t);
			}
		};

		return exports;
	},
	true
);

export function onStop() {
	GL.parcel.stopIntercepts("CustomServer");
}
