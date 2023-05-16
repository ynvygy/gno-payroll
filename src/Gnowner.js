import React, { useState, useEffect } from 'react';

const Gnowner = ({payrollContract, signer}) => {
  const [permissions, setPermissions] = useState([]);
  const [permissionsState, setPermissionsState] = useState([]);

  useEffect(() => {
    async function fetchPermissions() {
      const permissions = await payrollContract.getPermissions();
      setPermissions(permissions[0]);
      setPermissionsState(permissions[1]);
    };
    fetchPermissions();
  }, [payrollContract]);

  async function handleSubmit(e) {
    e.preventDefault();
    await payrollContract.connect(signer).setPermissions(permissionsState);
  }

  const handleCheckboxChange = (index) => {
    const newPermissionsState = [...permissionsState];
    newPermissionsState[index] = !newPermissionsState[index];
    setPermissionsState(newPermissionsState);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Permissions</h2>
      {permissions.map((permission, index) => (
        <div key={index}>
          <input
            type="checkbox"
            checked={permissionsState[index]}
            onChange={() => handleCheckboxChange(index)}
          />
          <label>
            {permissions[index]}
          </label>
        </div>
      ))}
      <button type="submit">Save</button>
    </form>
  );
};

export default Gnowner;
