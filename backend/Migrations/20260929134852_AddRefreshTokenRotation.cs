using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenRotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "family_id",
                table: "refresh_token",
                type: "varchar(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            // Token có sẵn: mỗi dòng là một family riêng để logout / thu hồi không ảnh hưởng phiên khác
            migrationBuilder.Sql("UPDATE refresh_token SET family_id = REPLACE(UUID(), '-', '') WHERE family_id = '';");

            migrationBuilder.AddColumn<string>(
                name: "replaced_by_token",
                table: "refresh_token",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "revoked_at",
                table: "refresh_token",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_refresh_token_family_id",
                table: "refresh_token",
                column: "family_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_refresh_token_family_id",
                table: "refresh_token");

            migrationBuilder.DropColumn(
                name: "family_id",
                table: "refresh_token");

            migrationBuilder.DropColumn(
                name: "replaced_by_token",
                table: "refresh_token");

            migrationBuilder.DropColumn(
                name: "revoked_at",
                table: "refresh_token");
        }
    }
}
