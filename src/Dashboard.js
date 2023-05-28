import { useState, useEffect } from "react";
import eurefakeContractData from './data/eurefake-contract.json';
import eurefakeContractBytecode from './data/Eurefake.json';
import { ethers } from "ethers";

const eurefakeAddress = eurefakeContractData.contract.address;

const Dashboard = ({payrollContract, signer}) => {
  const [contractBalance, setContractBalance] = useState(0);
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
            >
              <div className="health">
                Health status: {healthPercentage}%
              </div>
            </div>
          )}
      </div>
    </div>
      <div className="container">
        <div className="left-column balances">
          <div>
            <p>Contract Balance: </p><p className="green">{contractBalance}</p>
          </div>
        </div>
        <div className="right-column balances">
          <div>
            <p>Outstanding debt unpaid:</p><p className="red">{outstandingDebt}</p>
          </div>
          <div>
            <p>Contractor debt:</p><p className="red">{contractorDebt}</p> 
          </div>
          <div>
            <p>Tax expenses:</p><p className="red">{taxExpenses}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;