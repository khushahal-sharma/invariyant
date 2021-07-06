import React, { useMemo } from "react";
import { COLUMNS } from "./Columns";
import { usePagination, useTable } from "react-table";
import MOCK_DATA from "./MOCK_DATA.json";
import "./table.css";
import List from "./List";
import Table from "./Table";
import ReactHtmlTableToExcel from "react-html-table-to-excel";

const Pagination = () => {
    
  return (
    <div className="table-wrapper">
      <List />
      <Table />
     </div>
};

export default Pagination;
