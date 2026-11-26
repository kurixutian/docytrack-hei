import test from "node:test";
import assert from "node:assert/strict";
import {
  generateTrackingNumber,
  generatePublicLookupToken,
  getStatusLabel,
  getStatusColor,
  getRoleLabel,
  calculateDaysRemaining,
} from "../src/lib/utils";

test("generateTrackingNumber produces valid format", () => {
  const tracking = generateTrackingNumber();
  const currentYear = new Date().getFullYear();
  assert.match(tracking, new RegExp(`^DT-${currentYear}-[A-Z0-9]{8}$`));
});

test("generatePublicLookupToken produces unique tokens", () => {
  const token1 = generatePublicLookupToken();
  const token2 = generatePublicLookupToken();
  assert.notEqual(token1, token2);
  assert.ok(token1.length >= 16);
});

test("getStatusLabel maps statuses accurately", () => {
  assert.equal(getStatusLabel("submitted"), "Submitted");
  assert.equal(getStatusLabel("under_review"), "Under Review");
  assert.equal(getStatusLabel("approved"), "Approved");
  assert.equal(getStatusLabel("released"), "Released");
});

test("getStatusColor returns appropriate styling classes", () => {
  assert.ok(getStatusColor("approved").includes("green"));
  assert.ok(getStatusColor("rejected").includes("red"));
});

test("getRoleLabel maps institutional roles", () => {
  assert.equal(getRoleLabel("student"), "Student");
  assert.equal(getRoleLabel("department_chair"), "Department Chairperson");
  assert.equal(getRoleLabel("college_dean"), "College Dean");
  assert.equal(getRoleLabel("university_registrar"), "University Registrar");
  assert.equal(getRoleLabel("system_admin"), "System Administrator");
});

test("calculateDaysRemaining calculates day difference correctly", () => {
  const future = new Date(Date.now() + 86400000 * 3);
  const remaining = calculateDaysRemaining(future);
  assert.ok(remaining >= 2 && remaining <= 4);
});
