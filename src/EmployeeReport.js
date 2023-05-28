import React, { useState, useEffect } from 'react';

const EmployeeReport = ({ payrollContract, signer }) => {
  const [dates, setDates] = useState([]);
  const [sums, setSums] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);

  useEffect(() => {
    async function fetchPaymentData() {
      const paymentData = await payrollContract.connect(signer).getPaymentStatus();
      const [receivedDates, receivedSums, receivedPaymentStatuses] = paymentData;
      setDates(receivedDates);
      setSums(receivedSums);
      setPaymentStatuses(receivedPaymentStatuses);
      console.log(paymentData)
    }
    fetchPaymentData();
  }, [payrollContract]);

  const payOutstandingDebt = async () => {
    try {
      if (!signer) {
        console.error("No signer available");
        return;
      }

      const tx = await payrollContract.connect(signer).payUnpaidHours();
      await tx.wait();
      console.log("Payment successful");
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <div>
      <div className="hours-worked">
        <table className="standard-style">
          <thead>
            <tr>
              <th>Date</th>
              <th>Sum</th>
              <th>Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((date, index) => (
              <tr key={index}>
                <td>{new Date(date * 1000).toLocaleDateString()}</td>
                <td>{sums[index].toString()}</td>
                <td>{paymentStatuses[index].toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={payOutstandingDebt} className="employees-button add-button">Pay all outstanding debt</button>
    </div>
  );
};

export default EmployeeReport;
