import { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Employees from "./Employees";
import AddEmployee from "./AddEmployee";
import TaxRates from "./TaxRates";
import AddTaxRates from "./AddTaxRates";
import TaxReport from "./TaxReport";
import CustomNav from "./CustomNav";
import HoursReport from "./HoursReport";
import Dashboard from "./Dashboard";
import Gnowner from "./Gnowner";
import payrollContractData from './data/payroll-contract.json';
import EmployeeReport from "./EmployeeReport";
import GnownerReport from "./GnownerReport";

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState("");
  const [payrollContract, setPayrollContract] = useState({});

  const savedWalletAddress = localStorage.getItem("walletAddress");

  const payrollAddress = payrollContractData.contract.address;
  const payrollAbi = payrollContractData.contract.abi;

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        const signer = provider.getSigner();
        setProvider(provider);
        setSigner(signer);
        const accounts = await provider.listAccounts();
        setAccounts(accounts);
        setAccount(accounts[0]);

        const payrollContract = new ethers.Contract(payrollAddress, payrollAbi, provider);
        console.log(payrollContract)
        setPayrollContract(payrollContract);
        localStorage.setItem("walletAddress", account);
      } else {
        console.log("Please install MetaMask to use this application");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (savedWalletAddress) {
      setAccount(savedWalletAddress);
    }
  }, []);

  return (
    <div>
      <BrowserRouter>
        <CustomNav account={account} setAccount={setAccount} connectWallet={connectWallet}/>
        <Routes>
          <Route path="/" element={<Dashboard payrollContract={payrollContract} signer={signer} />} />
          <Route path="/employees" element={<Employees payrollContract={payrollContract} signer={signer}/>} />
          <Route path="/addemployee" element={<AddEmployee payrollContract={payrollContract} signer={signer} />} />
          <Route path="/taxrates" element={<TaxRates payrollContract={payrollContract} signer={signer} />} />
          <Route path="/addtaxrates" element={<AddTaxRates payrollContract={payrollContract} signer={signer}/>} />
          <Route path="/taxreport" element={<TaxReport payrollContract={payrollContract} signer={signer}/>} />
          <Route path="/hoursreport" element={<HoursReport payrollContract={payrollContract} signer={signer}/>} />
          <Route path="/gnowner" element={<Gnowner payrollContract={payrollContract} signer={signer}/>} />
          <Route path="/employeereport" element={<EmployeeReport payrollContract={payrollContract} signer={signer}/>} />
          <Route path="/gnownerreport" element={<GnownerReport payrollContract={payrollContract} signer={signer}/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
