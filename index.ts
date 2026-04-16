import { normalizePath, type Plugin } from "vite";
import { readFile } from "fs/promises";
import { dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VirtualId = "virtual:route";

export default function conventionRoutePlugin(): Plugin {
  let rootPath = "";
  let routeJsCode: string | null = null;
  let resolvedRoutePaths: Map<string, string> = new Map(); // virtualId -> absolute pages dir
  return {
    name: "vite-plugin-convention-route",
    enforce: "pre", // 在其他插件之前执行
    configResolved(config) {
      rootPath = config.root;
    },
    /**
     * 解析虚拟模块 ID
     * 当 Vite 遇到以 prefix 开头的导入时，会调用此函数
     */
    resolveId(id, importer) {
      if (id.startsWith(VirtualId)) {
        return importer ? id + "&importer=" + importer : id;
      }
      return null;
    },

    /**
     * 加载虚拟模块的内容
     * 当 Vite 需要加载虚拟模块时，会调用此函数返回模块的源代码
     */
    async load(id: string) {
      if (id.startsWith(VirtualId)) {
        if (!routeJsCode) {
          routeJsCode = await readFile(
            resolve(__dirname, "./route.js"),
            "utf8"
          );
        }

        const query = id.split("?")[1] ?? "";

        const params = new URLSearchParams(query);
        let routePath = params.get("routePath");
        if (!routePath) {
          throw new Error("routePath is required");
        }
        if (routePath[0] !== "/") {
          const importer = params.get("importer");
          if (!importer || importer === "undefined") {
            throw new Error(
              "something is wrong, please try to use absolute path"
            );
          }
          const { id } = (await this.resolve(routePath, importer)) || {
            id: "",
          };
          if (!id) {
            throw new Error(
              "routePath not found, please try to use absolute path, like /src/pages"
            );
          }
          const pagesDir = dirname(id);
          routePath = normalizePath("/" + relative(rootPath, pagesDir));
        }

        const _code = routeJsCode.replaceAll("__ROUTERS_PATH__", routePath);
        // Track which pages directory this virtual module watches
        resolvedRoutePaths.set(id.split("&importer=")[0], normalizePath(resolve(rootPath, routePath.slice(1))));
        return {
          code: _code,
          map: null, // 可以返回 source map，这里返回 null
        };
      }
      return null;
    },

    /**
     * 处理热更新
     * 当 pages 目录下有文件增删时，使虚拟模块失效以触发重新加载
     */
    handleHotUpdate({ file, server }) {
      const normalizedFile = normalizePath(file);
      for (const [virtualId, pagesDir] of resolvedRoutePaths) {
        if (normalizedFile.startsWith(pagesDir + "/")) {
          const mod = server.moduleGraph.getModuleById(virtualId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: "full-reload" });
          }
          break;
        }
      }
    },
  };
}
