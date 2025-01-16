-- Create the Domain table
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- Create unique index on Domain name
CREATE UNIQUE INDEX "Domain_name_key" ON "Domain"("name");
CREATE INDEX "Domain_name_idx" ON "Domain"("name");

-- Insert existing domains from Handle table
INSERT INTO "Domain" ("id", "name", "type", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as id, 
    subdomain as name, 
    'file' as type, 
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM (SELECT DISTINCT subdomain FROM "Handle") as unique_domains;

-- Add new columns to Handle table
ALTER TABLE "Handle" ADD COLUMN "domainId" TEXT;
ALTER TABLE "Handle" ADD COLUMN "did" TEXT;
ALTER TABLE "Handle" ADD COLUMN "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update Handle records with domain references
UPDATE "Handle" h
SET 
    "domainId" = d.id,
    "did" = h."subdomainValue"
FROM "Domain" d
WHERE h.subdomain = d.name;

-- Add not null constraints and foreign key
ALTER TABLE "Handle" ALTER COLUMN "domainId" SET NOT NULL;
ALTER TABLE "Handle" ALTER COLUMN "did" SET NOT NULL;
ALTER TABLE "Handle" ADD CONSTRAINT "Handle_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes
CREATE UNIQUE INDEX "Handle_handle_domainId_key" ON "Handle"("handle", "domainId");
CREATE INDEX "Handle_did_idx" ON "Handle"("did");
CREATE INDEX "Handle_handle_domainId_idx" ON "Handle"("handle", "domainId");

-- Drop old columns
ALTER TABLE "Handle" DROP COLUMN "subdomain";
ALTER TABLE "Handle" DROP COLUMN "subdomainValue"; 