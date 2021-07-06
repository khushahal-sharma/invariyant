import React, { useEffect, useMemo, useState } from "react";
import { COLUMNS } from "./Columns";
import { usePagination, useTable } from "react-table";
import MOCK_DATA from "./MOCK_DATA.json";
import "./table.css";
// import List from "./List";
import ReactHtmlTableToExcel from "react-html-table-to-excel";
import Loading from './Loading';

const Table = ({selectedMenu}) => {
  const [tableState, setTableState] = useState({});
  const [ loading, setLoading] = useState(false);

  let columns = [],
    data = [];
  useEffect(() => {
    const url = `http://127.0.0.1:7000/${
      selectedMenu || "getPersonData"
    }`;

    const fetchData = async () => {
      try {
        // setLoading(true)
        const response = await fetch(url);
        const updatedData = await response.json();
        // if(updatedData) setLoading(false)
        console.log(" updated data ", updatedData);
        
      } catch (error) {
        console.log("error", error);
        if(error){
          return (
            <h2>Somthing went wrong.Try reloading</h2>
          )
        }
        // error message show to state.
      }
    };

    fetchData();
  }, []);

  columns = useMemo(() => COLUMNS[selectedMenu], []);
  data = useMemo(() => MOCK_DATA, []);

  const tableInstance = useTable(
    {
      columns,
      data,
    },
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page,
    nextPage,
    previousPage,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state,
  } = tableInstance;

  const { pageIndex } = state;

  return (
    <div className="table">
      {/* {<div>Loading....</div>} */}
      {loading ? <Loading/> : 
      <>
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
          <div className="table-footer">
            <span>
              Page{" "}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>
            </span>
            <div>
              <button
                disabled={!canPreviousPage}
                onClick={() => previousPage()}
              >
                Pre
              </button>
              <button disabled={!canNextPage} onClick={() => nextPage()}>
                Next
              </button>
            </div>
          </div>
        </table>
        <div>
          <ReactHtmlTableToExcel
            id="test-table-xls-button"
            className="download-table-xls-button"
            table="table-to-xls"
            filename="tablexls"
            sheet="tablexls"
            buttonText="Export as xls"
          />
        </div>
      </>}
    </div>
  );
};

export default Table;
