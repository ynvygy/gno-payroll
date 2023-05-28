import { useState } from 'react';

function AddTaxRates({payrollContract, signer}) {
  const [countryName, setCountryName] = useState("");
  const [taxNames, setTaxNames] = useState([]);
  const [lowerLimits, setLowerLimits] = useState([]);
  const [upperLimits, setUpperLimits] = useState([]);
  const [taxValues, setTaxValues] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [taxTypeValues, setTaxTypeValues] = useState([]);

  const handleCountryNameChange = (event) => {
    setCountryName(event.target.value);
  };

  const handleLowerLimitsChange = (index, value) => {
    const newLowerLimits = [...lowerLimits];
    newLowerLimits[index] = value;
    setLowerLimits(newLowerLimits);
  };

  const handleTaxNamesChange = (index, value) => {
    const newTaxNames = [...taxNames];
    newTaxNames[index] = value;
    setTaxNames(newTaxNames);
  };

  const handleUpperLimitsChange = (index, value) => {
    const newUpperLimits = [...upperLimits];
    newUpperLimits[index] = value;
    setUpperLimits(newUpperLimits);
  };

  const handleTaxValuesChange = (index, value) => {
    const newTaxValues = [...taxValues];
    newTaxValues[index] = value;
    setTaxValues(newTaxValues);
  };

  const handleTaxTypesChange = (index, value) => {
    const newTaxTypes = [...taxTypes];
    newTaxTypes[index] = value;
    setTaxTypes(newTaxTypes);

    const newTaxTypeValues = [...taxTypeValues];
    if (value === 'percentage') {
      newTaxTypeValues[index] = '0';
    } else if (value === 'flat') {
      newTaxTypeValues[index] = '1';
    }
    setTaxTypeValues(newTaxTypeValues);
  };  
  
  const handleTaxRow = () => {
    setTaxNames([...taxNames, '']);
    setLowerLimits([...lowerLimits, 0]);
    setUpperLimits([...upperLimits, 0]);
    setTaxValues([...taxValues, '']);
    setTaxTypes([...taxTypes,'percentage']);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    console.log(countryName, taxNames, lowerLimits, upperLimits, taxValues, taxTypes);
    const tx = await payrollContract.connect(signer).addTaxRate(countryName, taxNames, lowerLimits, upperLimits, taxValues, taxTypes);
    await tx.wait();
    console.log("Tax Rate added successfully!");
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Tax Rate Builder</h2>
        <div className="input-container">
          <label for="country">Country</label>
          <input type="text" id="country" value={countryName} onChange={handleCountryNameChange} />
        </div>
        <br />
        <table>
          {taxNames.length != 0 ?
            (<thead>
              <tr>
                <th>Name</th>
                <th>Lower Limit</th>
                <th>Upper Limit</th>
                <th>Tax Value</th>
                <th>Tax Type</th>
              </tr>
            </thead>) : (<></>)
          }
          <tbody>
            {taxNames.map((item, index) => (
              <tr key={index}>
                <td><input type="text" value={taxNames[index]} onChange={(e) => handleTaxNamesChange(index, e.target.value)} /></td>
                <td><input type="number" value={lowerLimits[index]} onChange={(e) => handleLowerLimitsChange(index, e.target.value)} /></td>
                <td><input type="number" value={upperLimits[index]} onChange={(e) => handleUpperLimitsChange(index, e.target.value)} /></td>
                <td><input type="number" value={taxValues[index]} onChange={(e) => handleTaxValuesChange(index, e.target.value)} /></td>
                <td>
                  <select value={taxTypes[index]} onChange={(e) => handleTaxTypesChange(index, e.target.value)}>
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={handleTaxRow} className="employees-button add-button">Add</button>
        <br />
        <br />
        <button type="submit" className="employees-button">Save tax rate</button>
      </form>
    </div>
  );
}

export default AddTaxRates;