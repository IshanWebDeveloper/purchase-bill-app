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

