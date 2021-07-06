#===================================================================================================
EXECUTE BELOW SCRIPT IN	SQL SERVER AND CHANGE DATABASE CONFIGURATION INSIDE "dbConnection.js" FILE.
#===================================================================================================

CREATE DATABASE [Student]
GO

USE [Student]
GO

CREATE TABLE [dbo].[StudentInfo](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](50) NULL,
	[Age] [int] NULL,
 CONSTRAINT [PK_StudentInfo] PRIMARY KEY CLUSTERED 
	(
		[ID] ASC
	)
)