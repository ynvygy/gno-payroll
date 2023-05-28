import { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Employees from "./Employees";
import AddEmployee from "./AddEmployee";
import TaxRates from "./TaxRates";
import AddTaxRates from "./AddTaxRates";
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
  const [accountType, setAccountType] = useState("");

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

        window.ethereum.on("accountsChanged", handleAccountsChanged);

        const accounts = await provider.listAccounts();
        setAccounts(accounts);
        setAccount(accounts[0]);

        const payrollContract = new ethers.Contract(payrollAddress, payrollAbi, provider);
        console.log(payrollContract)
        setPayrollContract(payrollContract);
        localStorage.setItem("walletAddress", accounts[0]);
        getAccountType();
      } else {
        console.log("Please install MetaMask to use this application");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectHandler = () => {
    localStorage.removeItem("walletAddress");
    setAccount(null);
  };

  const handleAccountsChanged = (newAccounts) => {
    setAccounts(newAccounts);
    setAccount(newAccounts[0]);
    localStorage.setItem("walletAddress", newAccounts[0]);
  };

  const getAccountType = async () => {
    const accountType = await payrollContract.connect(signer).getAccountType();

    setAccountType(accountType);
  }

  const getPermissions = async () => {
    const accountType = await payrollContract.connect(signer).getAccountType();

    setAccountType(accountType);
  }

  useEffect(() => {
    if (savedWalletAddress) {
      setAccount(savedWalletAddress);
    }
  }, [getAccountType()]);

  return (
    <div>
      <BrowserRouter>
        <CustomNav account={account} setAccount={setAccount} connectWallet={connectWallet} disconnectHandler={disconnectHandler} accountType={accountType} getAccountType={getAccountType}/>
        <div className="dashboard">
          <Routes>
            <Route path="/" element={<Dashboard payrollContract={payrollContract} signer={signer} />} />
            <Route path="/employees" element={<Employees payrollContract={payrollContract} signer={signer} accountType={accountType}/>} />
            <Route path="/addemployee" element={<AddEmployee payrollContract={payrollContract} signer={signer}/>} />
            <Route path="/taxrates" element={<TaxRates payrollContract={payrollContract} signer={signer} />} />
            <Route path="/addtaxrates" element={<AddTaxRates payrollContract={payrollContract} signer={signer}/>} />
            <Route path="/hoursreport" element={<HoursReport payrollContract={payrollContract} signer={signer}/>} />
            <Route path="/gnowner" element={<Gnowner payrollContract={payrollContract} signer={signer}/>} />
            <Route path="/employeereport" element={<EmployeeReport payrollContract={payrollContract} signer={signer}/>} />
            <Route path="/gnownerreport" element={<GnownerReport payrollContract={payrollContract} signer={signer}/>} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
};

export default App;
