import React, { useState, useEffect } from 'react';

const EmployeeReport = ({ payrollContract, signer }) => {
  const [dates, setDates] = useState([]);
  const [sums, setSums] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);

  useEffect(() => {
    async function fetchPaymentData() {
      const paymentData = await payrollContract.getPaymentStatus();
      const [receivedDates, receivedSums, receivedPaymentStatuses] = paymentData;
      setDates(receivedDates);
      setSums(receivedSums);
      setPaymentStatuses(receivedPaymentStatuses);
    }
    fetchPaymentData();
  }, [payrollContract]);

  const payOutstandingDebt = async () => {
    try {
      if (!signer) {
        console.error("No signer available");
        return;
      }
      
      const contractWithSigner = payrollContract.connect(signer);
      const tx = await contractWithSigner.payUnpaidHours();
      await tx.wait();
      console.log("Payment successful");
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <div>
      <table>
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
      <button onClick={payOutstandingDebt}>Pay all outstanding debt</button>
    </div>
  );
};

export default EmployeeReport;
