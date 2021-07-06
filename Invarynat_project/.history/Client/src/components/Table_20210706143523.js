import React, { useMemo } from "react";
import { COLUMNS } from "./Columns";
import { usePagination, useTable } from "react-table";
import MOCK_DATA from "./MOCK_DATA.json";
import "./table.css";
import List from "./List";
import ReactHtmlTableToExcel from "react-html-table-to-excel";

const Pagination = () => {
  const columns = useMemo(() => COLUMNS, []);
  const data = useMemo(() => MOCK_DATA, []);

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
    <div className="table-wrapper">
      <List />
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
            <button disabled={!canPreviousPage} onClick={() => previousPage()}>
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
    </div>
  );
};

export default Table;
