import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ethers } from "ethers";
import eurefakeContractData from './data/eurefake-contract.json';
import eurefakeContractBytecode from './data/Eurefake.json';

const eurefakeAddress = eurefakeContractData.contract.address;

const GnownerReport = ({payrollContract, signer}) => {
  const [contractBalance, setContractBalance] = useState(0);
  const [filteredExpenses, setFilteredExpenses] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [outstandingDebt, setOutstandingDebt] = useState(0);
  const [contractorDebt, setContractorDebt] = useState(0);
  const [taxExpenses, setTaxExpenses] = useState(0);
  const [healthPercentage, setHealthPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContractBalance() {
      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
      const EurefakeContractFactory = new ethers.ContractFactory(eurefakeContractData.contract.abi, eurefakeContractBytecode.bytecode, signer || provider);
      const eurefakeContract = EurefakeContractFactory.attach(eurefakeAddress);
      const balance = await eurefakeContract.balanceOf(payrollContract.address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18);
      setContractBalance(formattedBalance.toString());
    }
    fetchContractBalance();

    async function fetchData() {
      const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
      const EurefakeContractFactory = new ethers.ContractFactory(eurefakeContractData.contract.abi, eurefakeContractBytecode.bytecode, signer || provider);
      const eurefakeContract = EurefakeContractFactory.attach(eurefakeAddress);

      const outstandingDebtPromise = payrollContract.getUnpaidSalariesSum();
      const contractorDebtPromise = payrollContract.getUnpaidContractorsSum();
      const taxExpensesPromise = payrollContract.getTaxExpenses();
      const contractBalancePromise = eurefakeContract.balanceOf(payrollContract.address);
    
      const [contractBalancea, outstandingDebta, contractorDebta, taxExpensesa] = await Promise.all([
        contractBalancePromise,
        outstandingDebtPromise,
        contractorDebtPromise,
        taxExpensesPromise
      ]);

      const formattedBalance = ethers.utils.formatUnits(contractBalancea, 18)
      setContractBalance(formattedBalance.toString());
      setOutstandingDebt(outstandingDebta.toString());
      setContractorDebt(contractorDebta.toString());
      setTaxExpenses(taxExpensesa.toString());
      
      setLoading(false);
    }
    
    fetchData();
  }, [payrollContract]);

  useEffect(() => {
    if (
      outstandingDebt !== null &&
      contractorDebt !== null &&
      taxExpenses !== null &&
      contractBalance !== null
    ) {
      setHealthPercentage(
        (
          (1 -
            (parseFloat(outstandingDebt) +
              parseFloat(taxExpenses) +
              parseFloat(contractorDebt)) /
              parseFloat(contractBalance)) *
          100
        ).toFixed(2)
      );
    }
  }, [outstandingDebt, contractorDebt, taxExpenses, contractBalance]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    const [contractorAddresses, contractorCountries, contractorSalaries] =
      await payrollContract.getFilteredExpenses(startTimestamp, endTimestamp);
    const filteredExpenses = [];
    for (let i = 0; i < contractorCountries.length; i++) {
      filteredExpenses.push({
        address: contractorAddresses[i],
        country: contractorCountries[i],
        salary: contractorSalaries[i],
      });
    }
    setFilteredExpenses(filteredExpenses);
  };

  const generateReports = async () => {
    await payrollContract.connect(signer).generatePaymentsForCurrentMonth(45);
  }

  return (
    <div>
      <div className="health-progress">
        <div className="progress-bar">
          {loading ? (
            <div className="progress-fill loading">Loading...</div>
          ) : (
            <div
              className="progress-fill"
              style={{ width: `${healthPercentage}%` }}
            ></div>
          )}
      </div>
    </div>
      <div>
        Contract Balance: {contractBalance}
      </div>
      <div>
        Outstanding debt unpaid: {outstandingDebt}
      </div>
      <div>
        Contractor debt: {contractorDebt}
      </div>
      <div>
        Tax expenses: {taxExpenses}
      </div>
      <div>
        Health status: {healthPercentage}
      </div>

      <button onClick={generateReports} className="employees-button">Generate new salary reports</button>

      <div className="date-picker">
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
        />
        <button onClick={handleFormSubmit} className="employees-button">Submit</button>
      </div>

      {filteredExpenses != null && (
        <table className="standard-table">
          <thead>
            <tr>
              <th>Contractor Address</th>
              <th>Country</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.address}>
                <td>{expense.address}</td>
                <td>{expense.country}</td>
                <td>{expense.salary.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GnownerReport;
