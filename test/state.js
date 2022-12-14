'use strict';

const Code = require('code');
const Hapi = require('..');
const Lab = require('lab');


const internals = {};


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('state', () => {

    it('parses cookies', (done) => {

        const handler = function (request, reply) {

            return reply(request.state);
        };

        const server = new Hapi.Server();
        server.connection();
        server.route({ method: 'GET', path: '/', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'v=a' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result.v).to.equal('a');
            done();
        });
    });

    it('sets a cookie value to a base64json string representation of an object', (done) => {

        const handler = function (request, reply) {

            return reply('ok').state('data', { b: 3 });
        };

        const server = new Hapi.Server();
        server.connection();
        server.state('data', { encoding: 'base64json' });
        server.route({ method: 'GET', path: '/', handler });

        server.inject('/', (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.headers['set-cookie']).to.equal(['data=eyJiIjozfQ==; Secure; HttpOnly; SameSite=Strict']);
            done();
        });
    });

    it('parses base64json cookies', (done) => {

        const handler = function (request, reply) {

            return reply(request.state);
        };

        const server = new Hapi.Server();
        server.connection();
        server.state('data', { encoding: 'base64json' });
        server.route({ method: 'GET', path: '/', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'data=eyJiIjozfQ==' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result.data).to.equal({ b: 3 });
            done();
        });
    });

    it('skips parsing cookies', (done) => {

        const handler = function (request, reply) {

            return reply(request.state);
        };

        const server = new Hapi.Server();
        server.connection({ routes: { state: { parse: false } } });
        server.route({ method: 'GET', path: '/', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'v=a' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(null);
            done();
        });
    });

    it('does not clear invalid cookie if cannot parse', (done) => {

        const handler = function (request, reply) {

            return reply(request.state);
        };

        const server = new Hapi.Server();
        server.connection();
        server.state('vab', { encoding: 'base64json', clearInvalid: true });
        server.route({ method: 'GET', path: '/', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'vab' } }, (res) => {

            expect(res.statusCode).to.equal(400);
            expect(res.headers['set-cookie']).to.not.exists();
            done();
        });
    });

    it('ignores invalid cookies (state level config)', (done) => {

        const handler = function (request, reply) {

            const log = request.getLog('state');
            return reply(log.length);
        };

        const server = new Hapi.Server();
        server.connection({ routes: { log: true } });
        server.state('a', { ignoreErrors: true, encoding: 'base64json' });
        server.route({ path: '/', method: 'GET', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'a=x' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(0);
            done();
        });
    });

    it('ignores invalid cookies (header)', (done) => {

        const handler = function (request, reply) {

            const log = request.getLog('state');
            return reply(log.length);
        };

        const server = new Hapi.Server();
        server.connection({ routes: { state: { failAction: 'ignore' }, log: true } });
        server.route({ path: '/', method: 'GET', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'a=x;;' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(0);
            done();
        });
    });

    it('ignores invalid cookie using server.state() (header)', (done) => {

        const handler = function (request, reply) {

            const log = request.getLog('state');
            return reply(log.length);
        };

        const server = new Hapi.Server();
        server.connection({ routes: { log: true } });
        server.state('a', { strictHeader: false });
        server.route({ path: '/', method: 'GET', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'a=x y;' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(0);
            done();
        });
    });

    it('logs invalid cookie (value)', (done) => {

        const handler = function (request, reply) {

            const log = request.getLog('state');
            return reply(log.length);
        };

        const server = new Hapi.Server();
        server.connection({ routes: { state: { failAction: 'log' }, log: true } });
        server.state('a', { encoding: 'base64json', clearInvalid: true });
        server.route({ path: '/', method: 'GET', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'a=x' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.equal(1);
            done();
        });
    });

    it('clears invalid cookies (state level config)', (done) => {

        const handler = function (request, reply) {

            return reply();
        };

        const server = new Hapi.Server();
        server.connection();
        server.state('a', { ignoreErrors: true, encoding: 'base64json', clearInvalid: true });
        server.route({ path: '/', method: 'GET', handler });
        server.inject({ method: 'GET', url: '/', headers: { cookie: 'a=x' } }, (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.headers['set-cookie'][0]).to.equal('a=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; SameSite=Strict');
            done();
        });
    });

    it('sets cookie value automatically', (done) => {

        const handler = function (request, reply) {

            return reply('ok');
        };

        const server = new Hapi.Server();
        server.connection();
        server.route({ method: 'GET', path: '/', handler });
        server.state('always', { autoValue: 'present' });

        server.inject('/', (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.headers['set-cookie']).to.equal(['always=present; Secure; HttpOnly; SameSite=Strict']);
            done();
        });
    });

    it('appends handler set-cookie to server state', (done) => {

        const handler = function (request, reply) {

            return reply().header('set-cookie', ['onecookie=yes', 'twocookie=no']);
        };

        const server = new Hapi.Server();
        server.connection();
        server.route({ method: 'GET', path: '/', handler });
        server.state('always', { autoValue: 'present' });

        server.inject('/', (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.headers['set-cookie']).to.equal(['onecookie=yes', 'twocookie=no', 'always=present; Secure; HttpOnly; SameSite=Strict']);
            done();
        });
    });

    it('sets cookie value automatically using function', (done) => {

        const present = function (request, next) {

            return next(null, request.params.x);
        };

        const handler = function (request, reply) {

            return reply('ok');
        };

        const server = new Hapi.Server();
        server.connection();
        server.route({ method: 'GET', path: '/{x}', handler });
        server.state('always', { autoValue: present });

        server.inject('/sweet', (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.headers['set-cookie']).to.equal(['always=sweet; Secure; HttpOnly; SameSite=Strict']);
            done();
        });
    });

    it('fails to set cookie value automatically using function', (done) => {

        const present = function (request, next) {

            return next(new Error());
        };

        const handler = function (request, reply) {

            return reply('ok');
        };

        const server = new Hapi.Server();
        server.connection();
        server.route({ method: 'GET', path: '/', handler });
        server.state('always', { autoValue: present });

        server.inject('/', (res) => {

            expect(res.statusCode).to.equal(500);
            expect(res.headers['set-cookie']).to.not.exist();
            done();
        });
    });

    it('sets cookie value with null ttl', (done) => {

        const handler = function (request, reply) {

            return reply('ok').state('a', 'b');
        };

        const server = new Hapi.Server();
        server.connection();
        server.state('a', { ttl: null });
        server.route({ method: 'GET', path: '/', handler });

        server.inject('/', (res) => {

            expect(res.statusCode).to.equal(200);
            expect(res.headers['set-cookie']).to.equal(['a=b; Secure; HttpOnly; SameSite=Strict']);
            done();
        });
    });
});
