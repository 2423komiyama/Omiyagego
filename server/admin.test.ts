import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAllProducts, getProductById, getAllFacilities, getAllReservations } from "./db";

/**
 * Admin API Tests
 * Tests for database query helpers used by admin procedures
 */

describe("Admin Database Helpers", () => {
  describe("Products", () => {
    it("should get all products", async () => {
      const products = await getAllProducts();
      expect(Array.isArray(products)).toBe(true);
    });

    it("should get product by id", async () => {
      // This test will work once we have products in the database
      const product = await getProductById("non-existent-id");
      expect(product).toBeUndefined();
    });
  });

  describe("Facilities", () => {
    it("should get all facilities", async () => {
      const facilities = await getAllFacilities();
      expect(Array.isArray(facilities)).toBe(true);
    });
  });

  describe("Reservations", () => {
    it("should get all reservations", async () => {
      const reservations = await getAllReservations();
      expect(Array.isArray(reservations)).toBe(true);
    });
  });
});
