CREATE TABLE "metrics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "metrics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lcp" integer NOT NULL,
	"commitSha" varchar(64) NOT NULL,
	"pathname" text,
	"browserName" varchar(100),
	"browserVersion" varchar(50),
	"browserMajor" varchar(10),
	"osName" varchar(100),
	"osVersion" varchar(50),
	"isBot" boolean DEFAULT false NOT NULL,
	"isAIAssistant" boolean DEFAULT false NOT NULL,
	"isAICrawler" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
