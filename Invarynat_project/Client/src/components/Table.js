import React, { useEffect, useMemo, useState } from "react";
import { usePagination, useTable } from "react-table";
import "./table.css";
import ReactHtmlTableToExcel from "react-html-table-to-excel";
import Loading from "./Loading";

const Table = () => {
  const [loading, setLoading] = useState(true);
  const [mockData, setMockData] = useState([]);
  const [makeColumns, setMakeColumns] = useState([]);
  const [selectedValue, setSelectedValue] = useState("");

  let tableInstance,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    nextPage,
    previousPage,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state;

  useEffect(() => {
    const url = `http://127.0.0.1:7000/getPersonData${
      selectedValue && `?VALUE=${selectedValue}`
    }`;
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        const updatedData = await response.json();
        // console.log(" updated data ", updatedData);
        if (updatedData.data) {
          let keys = Object.keys(updatedData.data[0] || {});
          let prepareCol = [];
          keys.map((key) => {
            let obj = {};
            obj.Header = key;
            obj.accessor = key;
            prepareCol.push(obj);
          });
          setMakeColumns(prepareCol);
          setMockData(updatedData.data);
          setLoading(false);
        }
      } catch (error) {
        console.log("error", error);
        if (error) {
          return <h2>Somthing went wrong.Try reloading</h2>;
        }
        // error message show to state.
      }
    };
    fetchData();
  }, [selectedValue]);

  let columns = useMemo(() => makeColumns, [mockData]),
    data = useMemo(() => mockData, [mockData]);

  tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        pageSize: 100,
      },
    },
    usePagination
  );

  ({
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    nextPage,
    previousPage,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state,
  } = tableInstance);

  const { pageIndex } = state;

  return (
    <div className="table">
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="table_items">
            <table id="table-to-xls" {...getTableProps()}>
              <thead>
                {headerGroups.map((headerGroup) => {
                  return (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => {
                        return (
                          <th {...column.getHeaderProps()}>
                            {column.render("Header")}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
              <tbody {...getTableBodyProps()}>
                {page.map((row) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()}>
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Page{" "}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>
            </span>
            <span>
              <label htmlFor="diseases">Select a diseases </label>
              <select
                defaultValue={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                name="diseases"
                id="list"
              >
                <option value="">None</option>
                <option value="O99.419">Cardiac Diseases</option>
                <option value="R06.02">Shortness of breath</option>
                <option value="R06.01">Severe orthopnea</option>
                {/* <option value="heart rate">Resting HR</option> */}
                {/* <option value="102225120">Resting Systolic BP</option> */}
                <option value="R09.02">Oxygen saturation</option>
                {/* <option value="Respiratory rate">Respiratory rate</option> */}
                <option value="R00.2">Palipitations</option>
                <option value="R60.9">Swelling</option>
                <option value="R06.00">Dyspnea</option>
                <option value="R06.82">Tachypnea</option>
                <option value="R51">New/Worsening headache</option>
                <option value="J45">Asthma unresponsive</option>
                <option value="R07.9">Chest pain</option>
                <option value="R42','R55">Dizziness or syncope</option>
                <option value="R01.1">Loud murmur heart</option>
              </select>
              {/* <input type="submit" /> */}
            </span>
            <div className="footer-buttons">
              <button
                className="button"
                disabled={!canPreviousPage}
                onClick={() => previousPage()}
              >
                Pre
              </button>
              <button
                className="button"
                disabled={!canNextPage}
                onClick={() => nextPage()}
              >
                Next
              </button>
            </div>
            <div>
              <ReactHtmlTableToExcel
                id="test-table-xls-button"
                className="export-button"
                table="table-to-xls"
                filename="tablexls"
                sheet="tablexls"
                buttonText="Export as xls"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Table;
