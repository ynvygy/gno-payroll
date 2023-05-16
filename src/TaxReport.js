import React, { useState, useEffect } from 'react';

const TaxReport = ({payrollContract, signer}) => {

  useEffect(() => {
    async function getCountries() {
      console.log('payrollContract', payrollContract)
      const countriesList = await payrollContract.calculateTaxes("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
      console.log("cl", countriesList)
      console.log("cl1", countriesList[1].toString())
    }
    getCountries();
  }, [payrollContract]);
  return (
    <div>
      da
    </div>
  );
};

export default TaxReport;