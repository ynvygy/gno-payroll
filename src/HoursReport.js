import React, { useState, useEffect } from 'react';

const HoursReport = ({payrollContract, signer}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [hours, setHours] = useState(0);
  const [salaryInfo, setSalaryInfo] = useState(null);
  const [workedDays, setWorkedDays] = useState([]);
  const [workedHours, setWorkedHours] = useState([]);

  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const fiveYearsAgoUnixTimestamp = Math.floor(fiveYearsAgo.getTime() / 1000);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  }

  const handleHoursChange = (event) => {
    setHours(event.target.value);
  }

  const handleAddHoursWorked = async () => {
    const dateUnixTimestamp = Math.floor(new Date(selectedDate).getTime() / 1000);
    const employeeId = 1; // replace with the actual employee ID
    await payrollContract.connect(signer).addHoursWorked(dateUnixTimestamp, hours);
  }

  const handleGetSalaryInfo = async () => {
    const dateUnixTimestamp = Math.floor(new Date(selectedDate).getTime() / 1000);
    const salary = await payrollContract.connect(signer).getThisMonthsSalaryInfo(dateUnixTimestamp, dateUnixTimestamp+10000000);
    setSalaryInfo(salary);
  }

  const handleShowMeWorkedHours = async () => {
    const [days, hours] = await payrollContract.connect(signer).getWorkedHours();
    setWorkedDays(days);
    setWorkedHours(hours);
  }

  return (
    <div>
      <input type="number" value={hours} onChange={handleHoursChange} />
      <input type="date" value={selectedDate} onChange={handleDateChange} />
      <button onClick={handleAddHoursWorked} className="employees-button">Add hours worked</button>
      <button onClick={handleGetSalaryInfo} className="employees-button">Get salary info</button>
      <button onClick={handleShowMeWorkedHours} className="employees-button">Show me worked hours</button>
      {salaryInfo !== null && <p>Salary info: {salaryInfo.toString()}</p>}

      <div>
        {workedDays.map((day, index) => (
          <div key={index}>
            <div>Date: {new Date(day * 1000).toLocaleDateString()}</div>
            <div>Hours worked: {workedHours[index].toString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoursReport;
