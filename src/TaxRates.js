import React, { useState, useEffect } from 'react';

const TaxRates = ({payrollContract, signer}) => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryName, setCountryName] = useState("");
  const [estimator, setEstimator] = useState(0);

  useEffect(() => {
    async function getCountries() {
      console.log('payrollContract', payrollContract)
      const countriesList = await payrollContract.getCountries();
      setCountries(countriesList);
      console.log("cl", countriesList)
    }
    getCountries();
  }, [payrollContract]);

  async function handleCountryClick(name) {
    const countryData = await payrollContract.getTaxRate(name);
    const estimator = await payrollContract.callStatic.salaryEstimator(name, 10000);
    setSelectedCountry(countryData);
    setEstimator(estimator);
    setCountryName(name);
  }

  const tableStyle = {
    '--num-columns': 5,
  };

  useEffect(() => {
    console.log(selectedCountry);
  }, [selectedCountry]);

  return (
    <div>
      <h2 className="tax-title">List of countries by tax rate</h2>
      <div className="container">
        <div className="left-column">
          <ul className="no-bullet">
            {countries.map((country, index) => (
              <li key={index} onClick={() => handleCountryClick(country)} className={countryName === country ? 'selected' : ''}>
                {country}
              </li>
            ))}
          </ul>
        </div>
        {selectedCountry ? (<div className="right-column">
          <table className="standard-style" style={tableStyle}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Lower Limit</th>
                <th>Upper Limit</th>
                <th>Tax Value</th>
                <th>Tax Type</th>
              </tr>
            </thead>
            <tbody>
              {selectedCountry &&
                selectedCountry.map((taxRate, index) => (
                  <tr key={index}>
                    <td>{taxRate.name}</td>
                    <td>${taxRate.lowerLimit.toString()}</td>
                    <td>${taxRate.upperLimit.toString()}</td>
                    {taxRate.taxType.toString() === "percentage" ? (
                      <td>{taxRate.taxValue.toString()}%</td>
                    ) : (
                      <td>${taxRate.taxValue.toString()}</td>
                    )}
                    <td>{taxRate.taxType.toString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="salary-estimator">
            <h2 className="estimator-text">Salary estimator for $10.000 / month</h2>
            <h2 className="estimator-value">${estimator.toString()}</h2>
          </div>
        </div>
        ) : (<div></div>) }
      </div>
    </div>
  );
};

export default TaxRates;
