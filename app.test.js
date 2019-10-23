/* eslint no-undef: "off", no-use-before-define: "off", no-unused-vars: "off",
no-underscore-dangle: "off" */
const rewire = require('rewire');

const appRewire = rewire('./app.js');
const nock = require('nock');
const chai = require('chai');
const url = require('url');
const config = require('./config');

const should = chai.should();

const testFilePath = 'test-input.json';

const jsonObj = [
  {
    date: '2016-01-05',
    user_id: 1,
    user_type: 'natural',
    type: 'cash_in',
    operation: {
      amount: 200.00,
      currency: 'EUR',
    },
  },
  {
    date: '2016-01-06',
    user_id: 2,
    user_type: 'juridical',
    type: 'cash_out',
    operation: {
      amount: 300.00,
      currency: 'EUR',
    },
  },
  {
    date: '2016-02-15',
    user_id: 1,
    user_type: 'natural',
    type: 'cash_out',
    operation: {
      amount: 300.00,
      currency: 'EUR',
    },
  },
  {
    date: '2016-02-16',
    user_id: 1,
    user_type: 'natural',
    type: 'cash_out',
    operation: {
      amount: 1100.00,
      currency: 'EUR',
    },
  },
  {
    date: '2016-02-21',
    user_id: 1,
    user_type: 'natural',
    type: 'cash_out',
    operation: {
      amount: 100.00,
      currency: 'EUR',
    },
  },
];

const cashInConfig = {
  percents: 0.03,
  max: {
    amount: 5,
    currency: 'EUR',
  },
};

const cashOutNaturalConfig = {
  percents: 0.3,
  week_limit: {
    amount: 1000,
    currency: 'EUR',
  },
};

const cashOutJuridicalConfig = {
  percents: 0.3,
  min: {
    amount: 0.5,
    currency: 'EUR',
  },
};

describe('App Unit tests', () => {
  beforeEach(() => {
    nock(`${url.parse(config.cashInConfigUrl).protocol}//${url.parse(config.cashInConfigUrl).host}`)
      .get(url.parse(config.cashInConfigUrl).path)
      .reply(200, cashInConfig);
    nock(`${url.parse(config.cashInConfigUrl).protocol}//${url.parse(config.cashOutNaturalConfigUrl).host}`)
      .get(url.parse(config.cashOutNaturalConfigUrl).path)
      .reply(200, cashOutNaturalConfig);
    nock(`${url.parse(config.cashInConfigUrl).protocol}//${url.parse(config.cashOutLegalConfigUrl).host}`)
      .get(url.parse(config.cashOutLegalConfigUrl).path)
      .reply(200, cashOutJuridicalConfig);
  });

  it('it should return a json object from file', (done) => {
    const parseFileData = appRewire.__get__('parseFileData');
    parseFileData(`./${testFilePath}`).then((data) => {
      data.should.be.a('array');
      data.should.deep.equal(jsonObj);
      done();
    });
  });

  it('it should return a configuration', (done) => {
    const getConfigurations = appRewire.__get__('getConfigurations');
    getConfigurations().then((data) => {
      data.should.be.a('object');
      data.should.have.property('cashInConfig');
      data.should.have.property('cashOutNaturalConfig');
      data.should.have.property('cashOutLegalConfig');
      done();
    });
  });

  it('it should round given number to two digits after the decimal point', (done) => {
    const roundToCents = appRewire.__get__('roundToCents');
    const result = roundToCents(32.5431);
    result.should.be.a('number');
    result.should.equal(32.55);
    done();
  });

  it('it should calculate cash in commission fees', (done) => {
    const calculateCashInCommissionFees = appRewire.__get__('calculateCashInCommissionFees');
    calculateCashInCommissionFees(jsonObj[0], cashInConfig).then((result) => {
      result.should.be.a('number');
      result.should.equal(0.06);
      done();
    });
  });

  it('it should calculate cash out natural commission fees', (done) => {
    const calculateCashOutNaturalCommissionFees = appRewire.__get__('calculateCashOutNaturalCommissionFees');
    calculateCashOutNaturalCommissionFees(jsonObj, cashOutNaturalConfig, 2).then((result) => {
      result.should.be.a('number');
      result.should.equal(0);
      done();
    });
  });

  it('it should calculate cash out juridical commission fees', (done) => {
    const calculateCashOutLegalCommissionFees = appRewire.__get__('calculateCashOutLegalCommissionFees');
    calculateCashOutLegalCommissionFees(jsonObj[1], cashOutJuridicalConfig).then((result) => {
      result.should.be.a('number');
      result.should.equal(0.9);
      done();
    });
  });

  it('it should reject main() function', (done) => {
    const main = appRewire.__get__('main');
    main().catch(() => {
      done();
    });
  });

  it('it should reject main() function with file not existing', (done) => {
    const main = appRewire.__get__('main');
    main('not-existing-file.json').catch(() => {
      done();
    });
  });

  it('it should resolve main() function', (done) => {
    const main = appRewire.__get__('main');
    main(testFilePath).then(() => {
      done();
    });
  });
});
