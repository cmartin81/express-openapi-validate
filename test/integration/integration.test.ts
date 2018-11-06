/*
  Copyright 2018 Santeri Hiltunen

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import request from "supertest";
// eslint-disable-next-line
import OpenApiValidator from "../../dist/OpenApiValidator";
import openApiDocument from "../open-api-document";
import app from "./app";

const validator = new OpenApiValidator(openApiDocument);

describe("Integration tests with real app", () => {
  test("requests against /echo are validated correctly", async () => {
    const validate = validator.validateResponse("post", "/echo");

    let res = await request(app)
      .post("/echo")
      .send({});
    expect(validate(res)).toBeUndefined();
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toMatchSnapshot();

    res = await request(app)
      .post("/echo")
      .send({ input: "Hello!" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ output: "Hello!" });
    expect(validate(res)).toBeUndefined();
  });

  test("path parameters are validated", async () => {
    let res = await request(app).get("/parameters/id/lol");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toMatchSnapshot();

    res = await request(app).get("/parameters/id/789");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 789 });
  });

  test("query parameters are validated", async () => {
    let res = await request(app).get("/parameters");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toMatchSnapshot();

    res = await request(app)
      .get("/parameters")
      .query({ porom: "moi" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toMatchSnapshot();

    res = await request(app)
      .get("/parameters")
      .query({ param: "hallo", porom: "moi" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ param: "hallo", porom: "moi" });
  });

  test("several path parameters are validated", async () => {
    const uuid1 = '11111111-1111-1111-1111-111111111111';
    const uuid2 = '22222222-2222-2222-2222-222222222222';
    const uuid3 = '33333333-3333-3333-3333-333333333333';

    const res = await request(app).get(`/parameters/several/${uuid1}/a/${uuid2}/b/${uuid3}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ a: uuid1, b: uuid2, c: uuid3 });
  });

  test("several path parameters are validated -- POST", async () => {
    const uuid1 = '11111111-1111-1111-1111-111111111111';
    const uuid2 = '22222222-2222-2222-2222-222222222222';
    const uuid3 = '33333333-3333-3333-3333-333333333333';

    const res = await request(app).post(`/parameters/several/${uuid1}/a/${uuid2}/b/${uuid3}`).send({bar: 'foobar', baz: 'foobaz'});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ a: uuid1, b: uuid2, c: uuid3 });
  });

  test("header parameters are validated", async () => {
    let res = await request(app).get("/parameters/header");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toMatchSnapshot();

    res = await request(app)
      .get("/parameters/header")
      .set("X-param", "hullo");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ header: "hullo" });
  });

  test("cookie parameters are validated", async () => {
    let res = await request(app).get("/parameters/cookie");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toMatchSnapshot();

    res = await request(app)
      .get("/parameters/cookie")
      .set("cookie", "session=hullo");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ cookie: "hullo" });
  });
});
