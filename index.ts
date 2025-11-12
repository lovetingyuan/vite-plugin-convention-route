import { normalizePath, type Plugin } from "vite";
import { readFile } from "fs/promises";
import { dirname, relative, resolve } from "path";

const VirtualId = "virtual:route";

export default function conventionRoutePlugin(): Plugin {
  let rootPath = "";
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
        return id + "&importer=" + importer;
      }
      return null;
    },

    /**
     * 加载虚拟模块的内容
     * 当 Vite 需要加载虚拟模块时，会调用此函数返回模块的源代码
     */
    async load(id: string) {
      if (id.startsWith(VirtualId)) {
        const code = await readFile(
          resolve(import.meta.dirname, "./route.js"),
          "utf8"
        );

        const query = id.split("?")[1];

        const params = new URLSearchParams(query);
        let routePath = params.get("routePath");
        if (!routePath) {
          throw new Error("routePath is required");
        }
        if (routePath[0] !== "/") {
          const importer = params.get("importer");
          if (!importer) {
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

        const _code = code.replaceAll("__ROUTERS_PATH__", routePath);
        return {
          code: _code,
          map: null, // 可以返回 source map，这里返回 null
        };
      }
      return null;
    },

    /**
     * 处理热更新
     * 当虚拟模块需要更新时，可以触发 HMR
     */
    // handleHotUpdate() {
    // 检查是否有文件变化需要更新虚拟模块
    // 这里可以根据需要实现自定义的热更新逻辑
    // return null;
    // },
  };
}
