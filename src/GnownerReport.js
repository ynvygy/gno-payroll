import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


const GnownerReport = ({payrollContract, signer}) => {
  const [expenses, setExpenses] = useState(null);
  const [filteredExpenses, setFilteredExpenses] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    async function fetchMonthlyExpenses() {
      const [contractorAddresses, contractorCountries, contractorSalaries] =
        await payrollContract.getMonthlyExpenses();
      const newExpenses = [];

      for (let i = 0; i < contractorAddresses.length; i++) {
        newExpenses.push({
          address: contractorAddresses[i],
          country: contractorCountries[i],
          salary: contractorSalaries[i],
        });
      }

      setExpenses(newExpenses);
    }

    fetchMonthlyExpenses();
  }, []);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const startTimestamp = startDate.getTime() / 1000;
    const endTimestamp = endDate.getTime() / 1000;
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

  return (
    <div>
      <h1>Monthly Expenses</h1>
      <table>
        <thead>
          <tr>
            <th>Contractor Address</th>
            <th>Country</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          {expenses && expenses.map((expense) => (
            <tr key={expense.address}>
              <td>{expense.address}</td>
              <td>{expense.country}</td>
              <td>{expense.salary} ETH</td>
            </tr>
          ))}
        </tbody>
      </table>

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
