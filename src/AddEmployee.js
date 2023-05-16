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
      <label>
        Name:
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <br />
      <label>
        Age:
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
      </label>
      <br />
      <label>
        Salary:
        <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
      </label>
      <br />
      <label>
        Is Contractor:
        <input type="checkbox" checked={isContractor} onChange={(e) => setIsContractor(e.target.checked)} />
      </label>
      <br />
      <label>
        Country:
        <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} />
      </label>
      <br />
      <label>
        Pay Address:
        <input type="text" value={payAddress} onChange={(e) => setPayAddress(e.target.value)} />
      </label>
      <br />
      <label>
        Is HR:
        <input type="checkbox" checked={isHr} onChange={(e) => setIsHr(e.target.checked)} />
      </label>
      <br />
      <button type="submit">Add Employee</button>
    </form>
  );
};

export default AddEmployee;