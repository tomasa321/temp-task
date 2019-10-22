/* eslint no-undef: "off", no-use-before-define: "off", no-unused-vars: "off",
no-underscore-dangle: "off" */
const rewire = require('rewire');

const appRewire = rewire('./app.js');
const chai = require('chai');

const should = chai.should();

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
];

const cashInConfig = {
  percents: 0.03,
  max: {
    amount: 5,
    currency: 'EUR',
  },
};

describe('App Unit tests', () => {
  it('it should return a json object from file', (done) => {
    const parseFileData = appRewire.__get__('parseFileData');

    parseFileData('./test-input.json').then((data) => {
      data.should.be.a('array');
      data.should.deep.equal(jsonObj);
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
});
