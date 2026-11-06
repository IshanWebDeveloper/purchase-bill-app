IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106132450_InitialCreate'
)
BEGIN
    CREATE TABLE [Location_Details] (
        [Id] int NOT NULL IDENTITY,
        [Location_Code] nvarchar(50) NOT NULL,
        [Location_Name] nvarchar(200) NOT NULL,
        CONSTRAINT [PK_Location_Details] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106132450_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Location_Details_Location_Code] ON [Location_Details] ([Location_Code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106132450_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261106132450_InitialCreate', N'8.0.33');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    ALTER TABLE [Location_Details] ADD CONSTRAINT [AK_Location_Details_Location_Code] UNIQUE ([Location_Code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    CREATE TABLE [Purchase_Bills] (
        [Id] int NOT NULL IDENTITY,
        [CreatedBy] nvarchar(256) NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Purchase_Bills] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    CREATE TABLE [Purchase_Bill_Items] (
        [Id] int NOT NULL IDENTITY,
        [BillId] int NOT NULL,
        [ItemName] nvarchar(100) NOT NULL,
        [BatchCode] nvarchar(50) NOT NULL,
        [StandardCost] decimal(18,2) NOT NULL,
        [StandardPrice] decimal(18,2) NOT NULL,
        [Qty] int NOT NULL,
        [FreeQty] int NOT NULL,
        [DiscountPercent] decimal(5,2) NOT NULL,
        [TotalCost] decimal(18,2) NOT NULL,
        [TotalSelling] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_Purchase_Bill_Items] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Purchase_Bill_Items_Location_Details_BatchCode] FOREIGN KEY ([BatchCode]) REFERENCES [Location_Details] ([Location_Code]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Purchase_Bill_Items_Purchase_Bills_BillId] FOREIGN KEY ([BillId]) REFERENCES [Purchase_Bills] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    CREATE INDEX [IX_Purchase_Bill_Items_BatchCode] ON [Purchase_Bill_Items] ([BatchCode]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    CREATE INDEX [IX_Purchase_Bill_Items_BillId] ON [Purchase_Bill_Items] ([BillId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    CREATE INDEX [IX_Purchase_Bills_CreatedBy] ON [Purchase_Bills] ([CreatedBy]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261106142301_AddPurchaseBills'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261106142301_AddPurchaseBills', N'8.0.33');
END;
GO

COMMIT;
GO

