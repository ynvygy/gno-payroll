import { useState } from "react";

const AddEmployee = ({payrollContract, signer}) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [salary, setSalary] = useState(0);
  const [isContractor, setIsContractor] = useState(false);
  const [country, setCountry] = useState("");
  const [payAddress, setPayAddress] = useState("");
  const [isHr, setIsHr] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const tx = await payrollContract.connect(signer).addEmployee(name, age, salary, isContractor, country, payAddress, isHr);
    //const tx = await payrollContract.connect(signer).getAllEmployees()
    await tx.wait();
    console.log("Employee added successfully!");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>New Employee</h2>
      <div className="input-container-name">
        <label for="name">Name</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <br />
      <div className="input-row">
        <div className="input-container">
          <label for="age">Age</label>
          <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="input-container">
          <label for="salary">Salary</label>
          <input type="number" id="salary" value={salary} onChange={(e) => setSalary(e.target.value)} />
        </div>
      </div>
      <br />
      <div className="row">
        <label for="iscontractor">Is Contractor: </label>
        <input type="checkbox" id="iscontractor" checked={isContractor} onChange={(e) => setIsContractor(e.target.checked)} />
      </div>
      <br />
      <div className="input-row">
        <div className="input-container">
          <label for="country">Country</label>
          <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="input-container">
          <label for="payaddress">Pay Address</label>
          <input type="text" id="payaddress" value={payAddress} onChange={(e) => setPayAddress(e.target.value)} />
        </div>
      </div>
      <br />
      <div className="row">
        <label for="ishr">Is HR: </label>
        <input type="checkbox" id="ishr" checked={isHr} onChange={(e) => setIsHr(e.target.checked)} />
      </div>
      <br />
      <button type="submit">Add Employee</button>
    </form>
  );
};

export default AddEmployee;