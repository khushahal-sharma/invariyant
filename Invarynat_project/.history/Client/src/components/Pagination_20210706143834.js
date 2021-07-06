import React, { useMemo } from "react";
import "./table.css";
import List from "./List";
import Table from "./Table";

const Pagination = () => {
  return (
    <div className="table-wrapper">
      <List />
      <Table />
    </div>
  );
};

export default Pagination;
