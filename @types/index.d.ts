declare namespace NodeJS {
	interface ProcessEnv {
		JWT_REFRESH_SECRET: string;
		JWT_ACCESS_SECRET: string;
	}
}
