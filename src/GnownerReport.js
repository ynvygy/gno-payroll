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
  const [taxExpenses, setTaxExpenses] = useState(0);

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

    async function fetchOutstandingDebt() {
      const outstandingDebt = await payrollContract.getUnpaidSalariesSum();
      setOutstandingDebt(outstandingDebt.toString());
    }
    fetchOutstandingDebt();

    async function fetchTaxExpenses() {
      const taxExpenses = await payrollContract.getTaxExpenses();
      setTaxExpenses(taxExpenses.toString());
    }
    fetchTaxExpenses();
  }, [payrollContract]);

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
      <button onClick={generateReports} className="employees-button">Generate reports</button>
      <div>
        Contract Balance: {contractBalance}
      </div>
      <div>
        Outstanding debt unpaid: {outstandingDebt}
      </div>
      <div>
        Tax expenses: {taxExpenses}
      </div>
      <div>
        Health status: {((1-(parseFloat(outstandingDebt)+parseFloat(taxExpenses))/parseFloat(contractBalance))*100).toFixed(2)}
      </div>

      <div>
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
        <button onClick={handleFormSubmit}>Submit</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Contractor Address</th>
            <th>Country</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses && filteredExpenses.map((expense) => (
            <tr key={expense.address}>
              <td>{expense.address}</td>
              <td>{expense.country}</td>
              <td>{expense.salary.toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GnownerReport;
