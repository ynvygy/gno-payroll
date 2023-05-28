// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Payroll {
    address owner;
    address[] hr;
    uint employeesCount;
    uint nextEmployeeId;
    IERC20 public eurefakeToken;

    // Structs
    // Holds employees and contractors
    struct Employee {
        string name;
        uint age;
        uint salary;
        bool contractor;
        string country;
        bool isHr;
    }

    struct TaxRate {
        string name;
        uint lowerLimit;
        uint upperLimit;
        uint taxValue;
        string taxType;
    }

    // Holds contractor hours per date reported
    struct ContractorHours {
        uint dateReported;
        uint hoursReported;
        address contractorAddress;
    }

    // Payments done to both contractors and employees
    struct Payment {
        uint paymentAmount;
        uint256 taxes;
        bool paid;
        bool paidTaxes;
    }

    // All employees related data structures
    mapping(address => Employee) public employees;
    address[] public employeeAddresses;
    mapping(address => Payment[]) employeeToPayments;

    // Only contractor data structures
    ContractorHours[] public contractorHours;
    mapping(uint => mapping(address => uint)) dateToContractorToHours;
    mapping(address => uint[]) contractorToDates;
    mapping(uint => mapping(address => Payment)) dateToContractorToPayment;

    // Other data structures
    mapping(string => TaxRate[]) CountriesToTaxRates;
    string[] public countries;
    string[] public permissions;
    mapping(string => bool) permissionsState;

    // Events
    event EmployeeAdded(
        address indexed payAddress,
        string name,
        uint age,
        uint salary,
        bool contractor,
        string country,
        bool isHr
    );

    event EmployeeUpdated(
        address indexed payAddress,
        string name,
        uint age,
        uint salary,
        bool contractor,
        string country,
        bool isHr
    );

    event TaxRateAdded(
        string indexed country,
        string name,
        uint lowerLimit,
        uint upperLimit,
        uint taxValue,
        string taxType
    );

    event HoursWorkedAdded(
        uint indexed date,
        address indexed contractor,
        uint hoursWorked,
        uint paymentAmount
    );

    event EmployeeRemoved(address indexed employeeAddress);

    // Modifiers
    modifier onlyPermitted() {
        require(
            keccak256(bytes(getAccountType())) == keccak256(bytes("HR")) ||
                keccak256(bytes(getAccountType())) ==
                keccak256(bytes("Gnowner")),
            "You do not have access rights"
        );
        _;
    }

    constructor(address eurefakeTokenAddress) {
        owner = msg.sender;
        permissions = [
            "Allow to add employees",
            "Allow to remove employees",
            "Allow to edit employees",
            "Allow to make payments"
        ];
        eurefakeToken = IERC20(eurefakeTokenAddress);
    }

    receive() external payable {}

    // Returns the list of countries
    function getCountries() external view returns (string[] memory) {
        return countries;
    }

    // Get account type of msg.sender
    function getAccountType() public view returns (string memory) {
        if (owner == msg.sender) {
            return "Gnowner";
        } else {
            Employee storage employee = employees[msg.sender];
            if (employee.isHr) {
                return "HR";
            } else if (employee.contractor) {
                return "Contractor";
            } else {
                return "Employee";
            }
        }
    }

    // Permissions
    // Returns the list of permissions
    function getPermissions()
        external
        view
        returns (string[] memory, bool[] memory)
    {
        uint256 numPermissions = permissions.length;
        bool[] memory permissionValues = new bool[](numPermissions);

        for (uint256 i = 0; i < numPermissions; i++) {
            bool permissionValue = permissionsState[permissions[i]];
            permissionValues[i] = permissionValue;
        }

        return (permissions, permissionValues);
    }

    // Sets the permission values
    function setPermissions(bool[] memory newPermissions) external {
        for (uint i = 0; i < newPermissions.length; i++) {
            permissionsState[permissions[i]] = newPermissions[i];
        }
    }

    // CRUD employees
    // Adds one employees (contractors included)
    function addEmployee(
        string memory _name,
        uint _age,
        uint _salary,
        bool _contractor,
        string memory _country,
        address _payAddress,
        bool _isHr
    ) external {
        Employee memory newEmployee = Employee(
            _name,
            _age,
            _salary,
            _contractor,
            _country,
            _isHr
        );
        employees[_payAddress] = newEmployee;
        if (_isHr) {
            hr.push(_payAddress);
        }
        employeeAddresses.push(_payAddress);
        nextEmployeeId++;

        emit EmployeeAdded(
            _payAddress,
            _name,
            _age,
            _salary,
            _contractor,
            _country,
            _isHr
        );
    }

    // Updates one employee (contractors included)
    function updateEmployee(
        address _employeeAddress,
        string memory _name,
        uint _age,
        uint _salary,
        bool _contractor,
        string memory _country,
        bool _isHr
    ) external {
        Employee storage employee = employees[_employeeAddress];

        employee.name = _name;
        employee.age = _age;
        employee.salary = _salary;
        employee.contractor = _contractor;
        employee.country = _country;
        employee.isHr = _isHr;

        emit EmployeeUpdated(
            _employeeAddress,
            _name,
            _age,
            _salary,
            _contractor,
            _country,
            _isHr
        );
    }

    // Removes one employee (contractors included)
    function removeEmployee(address employeeAddress) external {
        delete employees[employeeAddress];

        uint indexToRemove;
        for (uint i = 0; i < employeeAddresses.length; i++) {
            if (employeeAddresses[i] == employeeAddress) {
                indexToRemove = i;
                break;
            }
        }
        for (uint i = indexToRemove; i < employeeAddresses.length - 1; i++) {
            employeeAddresses[i] = employeeAddresses[i + 1];
        }
        employeeAddresses.pop();

        emit EmployeeRemoved(employeeAddress);
    }

    // Returns all employees (contractors included)
    function getEmployees()
        external
        view
        returns (Employee[] memory, address[] memory)
    {
        Employee[] memory result = new Employee[](employeeAddresses.length);
        for (uint i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            result[i] = employees[employeeAddress];
        }
        return (result, employeeAddresses);
    }

    // Tax related methods
    // Gets Tax Rate for specific country
    function getTaxRate(
        string memory country
    ) external view returns (TaxRate[] memory) {
        return CountriesToTaxRates[country];
    }

    // Adds one tax rate
    function addTaxRate(
        string memory country,
        string[] memory names,
        uint[] memory lowerLimits,
        uint[] memory upperLimits,
        uint[] memory taxValues,
        string[] memory taxTypes
    ) external {
        countries.push(country);
        for (uint i = 0; i < names.length; i++) {
            TaxRate memory taxRate = TaxRate({
                name: names[i],
                lowerLimit: lowerLimits[i],
                upperLimit: upperLimits[i],
                taxValue: taxValues[i],
                taxType: taxTypes[i]
            });
            CountriesToTaxRates[country].push(taxRate);

            emit TaxRateAdded(
                country,
                names[i],
                lowerLimits[i],
                upperLimits[i],
                taxValues[i],
                taxTypes[i]
            );
        }
    }

    // Returns tax expenses
    function getTaxExpenses() external view returns (uint256) {
        uint256 totalUnpaidTaxes = 0;

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            Payment[] storage payments = employeeToPayments[employeeAddress];

            for (uint256 j = 0; j < payments.length; j++) {
                if (!payments[j].paidTaxes) {
                    totalUnpaidTaxes += payments[j].taxes;
                }
            }
        }

        return totalUnpaidTaxes;
    }

    // Returns salary info for regular employees
    function getThisMonthsSalaryInfo(
        uint startDate,
        uint endDate
    ) public view returns (uint) {
        uint totalHours = getContractorHours(msg.sender, startDate, endDate);
        uint ratePerHour = employees[msg.sender].salary;
        return totalHours * ratePerHour;
    }

    // Contractor specific methods
    // Add hours worked for a day for a contractor
    function addHoursWorked(uint date, uint hoursWorked) external {
        dateToContractorToHours[date][msg.sender] += hoursWorked;
        contractorToDates[msg.sender].push(date);
        Employee storage employee = employees[msg.sender];
        uint toPay = hoursWorked * employee.salary;
        Payment memory payment = Payment(toPay, 0, false, false);
        console.log(msg.sender);
        dateToContractorToPayment[date][msg.sender] = payment;
        emit HoursWorkedAdded(date, msg.sender, hoursWorked, toPay);
    }

    // Function 1 to return worked hours for a contractor
    function getWorkedHours()
        external
        view
        returns (uint[] memory, uint[] memory)
    {
        return getContractorWorkedHours(msg.sender);
    }

    function getContractorWorkedHours(
        address contractor
    ) public view returns (uint[] memory, uint[] memory) {
        uint[] storage contractorDates = contractorToDates[contractor];
        uint numDates = contractorDates.length;
        uint[] memory datesW = new uint[](numDates);
        uint[] memory hoursW = new uint[](numDates);

        for (uint i = 0; i < numDates; i++) {
            uint date = contractorDates[i];
            datesW[i] = date;
            hoursW[i] = dateToContractorToHours[date][contractor];
        }

        return (datesW, hoursW);
    }

    // Returns contractor total hours worked
    function getContractorHours(
        address _address,
        uint startDate,
        uint endDate
    ) public view returns (uint) {
        uint totalHours = 0;
        uint[] storage datesWorked = contractorToDates[_address];
        for (uint i = 0; i < datesWorked.length; i++) {
            uint date = datesWorked[i];
            if (date >= startDate && date <= endDate) {
                totalHours += dateToContractorToHours[date][_address];
            }
        }
        return totalHours;
    }

    // Returns hours worked on a specific date for a contractor
    function getHoursWorked(
        uint date,
        address _address
    ) external view returns (uint) {
        return dateToContractorToHours[date][_address];
    }

    function getUnpaidContractorsSum() external view returns (uint256) {
        uint totalUnpaidAmount = 0;
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            if (employees[employeeAddress].contractor) {
                uint[] storage dates = contractorToDates[employeeAddress];

                for (uint i = 0; i < dates.length; i++) {
                    Payment storage payment = dateToContractorToPayment[
                        dates[i]
                    ][employeeAddress];
                    if (!payment.paid) {
                        totalUnpaidAmount += payment.paymentAmount;
                    }
                }
            }
        }
        return totalUnpaidAmount;
    }

    // All types of employees related methods
    // Pays unpaid hours owed to contractor that calls the method
    function payUnpaidHours() external {
        uint totalPayment = 0;

        Employee storage employee = employees[msg.sender];
        if (employee.contractor) {
            for (uint i = 0; i < contractorToDates[msg.sender].length; i++) {
                uint date = contractorToDates[msg.sender][i];

                Payment storage payment = dateToContractorToPayment[date][
                    msg.sender
                ];

                if (!payment.paid) {
                    totalPayment += payment.paymentAmount;
                    payment.paid = true;
                }
            }
            uint256 amount = totalPayment * (10 ** 18);
            eurefakeToken.transfer(msg.sender, amount);
        } else {
            Payment[] storage payments = employeeToPayments[msg.sender];
            for (uint i = 0; i < payments.length; i++) {
                uint toPay = (payments[i].paymentAmount + payments[i].taxes) *
                    (10 ** 18);
                eurefakeToken.transfer(msg.sender, toPay);
                payments[i].paid = true;
            }
        }
    }

    // Returns payment status of all payments for all employees (contractors included)
    function getPaymentStatus()
        external
        view
        returns (uint[] memory, uint[] memory, bool[] memory)
    {
        Employee storage employee = employees[msg.sender];

        if (employee.contractor) {
            uint numDates = contractorToDates[msg.sender].length;
            uint[] memory dates = new uint[](numDates);
            uint[] memory sums = new uint[](numDates);
            bool[] memory paymentStatuses = new bool[](numDates);

            for (uint i = 0; i < numDates; i++) {
                uint date = contractorToDates[msg.sender][i];
                dates[i] = date;
                sums[i] =
                    dateToContractorToHours[date][msg.sender] *
                    employee.salary;
                paymentStatuses[i] = dateToContractorToPayment[date][msg.sender]
                    .paid;
            }

            return (dates, sums, paymentStatuses);
        } else {
            uint numDates = employeeToPayments[msg.sender].length;

            uint[] memory totalSalaries = new uint[](numDates);
            uint[] memory afterTaxes = new uint[](numDates);
            bool[] memory paymentStatuses = new bool[](numDates);

            for (uint i = 0; i < numDates; i++) {
                totalSalaries[i] = employee.salary;
                afterTaxes[i] = salaryEstimator(
                    employee.country,
                    employee.salary
                );
                paymentStatuses[i] = employeeToPayments[msg.sender][i].paid;
            }
            return (totalSalaries, afterTaxes, paymentStatuses);
        }
    }

    // Returns salary and tax expenses (per employee - contractor included)
    function getFilteredExpenses(
        uint startDate,
        uint endDate
    ) external view returns (address[] memory, string[] memory, uint[] memory) {
        uint[] memory salaries = new uint[](employeeAddresses.length);
        string[] memory countries = new string[](employeeAddresses.length);

        for (uint i = 0; i < employeeAddresses.length; i++) {
            address employee = employeeAddresses[i];
            uint salary;
            if (employees[employee].contractor) {
                uint[] storage workedDates = contractorToDates[employee];
                uint totalHours = 0;

                for (uint j = 0; j < workedDates.length; j++) {
                    uint date = workedDates[j];
                    if (date >= startDate && date <= endDate) {
                        totalHours += dateToContractorToHours[date][employee];
                    }
                }
                salary = totalHours * employees[employee].salary;
            } else {
                salary = salaryEstimator(
                    employees[employee].country,
                    employees[employee].salary
                );
            }
            salaries[i] = salary;
            countries[i] = employees[employee].country;
        }

        return (employeeAddresses, countries, salaries);
    }

    // Employee related methods (excluding contractors)
    // Returns salary estimator for an employee based on country and salary
    function salaryEstimator(
        string memory _country,
        uint _value
    ) public view returns (uint) {
        uint salaryLeft = _value;
        TaxRate[] memory taxRate = CountriesToTaxRates[_country];
        for (uint i = 0; i < taxRate.length; i++) {
            if (taxRate[i].lowerLimit == 0 && taxRate[i].upperLimit == 0) {
                if (
                    keccak256(abi.encodePacked(taxRate[i].taxType)) ==
                    keccak256(abi.encodePacked("flat"))
                ) {
                    salaryLeft -= taxRate[i].taxValue;
                } else {
                    salaryLeft -= (_value * taxRate[i].taxValue) / 100;
                }
            } else if (
                _value >= taxRate[i].lowerLimit && taxRate[i].upperLimit == 0
            ) {
                if (
                    keccak256(abi.encodePacked(taxRate[i].taxType)) ==
                    keccak256(abi.encodePacked("flat"))
                ) {
                    salaryLeft -= taxRate[i].taxValue;
                } else {
                    salaryLeft -=
                        ((_value - taxRate[i].lowerLimit) *
                            taxRate[i].taxValue) /
                        100;
                }
            } else if (
                _value >= taxRate[i].lowerLimit &&
                _value >= taxRate[i].upperLimit
            ) {
                if (
                    keccak256(abi.encodePacked(taxRate[i].taxType)) ==
                    keccak256(abi.encodePacked("flat"))
                ) {
                    salaryLeft -= taxRate[i].taxValue;
                } else {
                    salaryLeft -=
                        ((taxRate[i].upperLimit - taxRate[i].lowerLimit) *
                            taxRate[i].taxValue) /
                        100;
                }
            }
        }
        return salaryLeft;
    }

    // Returns employee salary after taxes
    function getEmployeeSalary() external view returns (uint) {
        Employee storage employee = employees[msg.sender];
        string memory country = employee.country;
        uint salary = employee.salary;
        return salaryEstimator(country, salary);
    }

    // Generates payments for employees (contractors excluded)
    function generatePaymentsForCurrentMonth(uint monthUnix) public {
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            Employee memory employee = employees[employeeAddresses[i]];
            if (!employee.contractor) {
                uint256 paymentAmount = salaryEstimator(
                    employee.country,
                    employee.salary
                );
                uint256 taxes = employee.salary - paymentAmount;

                Payment memory payment = Payment(
                    paymentAmount,
                    taxes,
                    false,
                    false
                );
                employeeToPayments[employeeAddresses[i]].push(payment);
            }
        }
    }

    // Returns sum of unpaid salaries of employees (contractors excluded)
    function getUnpaidSalariesSum() external view returns (uint256) {
        uint256 totalUnpaidSalaries = 0;

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            address employeeAddress = employeeAddresses[i];
            Payment[] storage payments = employeeToPayments[employeeAddress];

            for (uint256 j = 0; j < payments.length; j++) {
                if (!payments[j].paid) {
                    totalUnpaidSalaries += payments[j].paymentAmount;
                }
            }
        }

        return totalUnpaidSalaries;
    }
}
