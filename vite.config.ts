import { defineConfig } from "vite-plus";

export default defineConfig({
	pack: {
		minify: true,
		fixedExtension: false,
		deps: {
			onlyBundle: false,
		},
	},
	fmt: {
		sortImports: true,
		tabWidth: 4,
		useTabs: true,
	},
	lint: { options: { typeAware: true, typeCheck: true } },
});
