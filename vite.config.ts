import { defineConfig } from "vite-plus";

export default defineConfig({
	fmt: {
		sortImports: true,
		tabWidth: 4,
		useTabs: true,
	},
	lint: { options: { typeAware: true, typeCheck: true } },
});
