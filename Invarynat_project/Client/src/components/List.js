import React from "react";
import "./list.css";

const List = ({ selectMenu }) => {
  return (
    <div className="list">
      <ol>
        <li onClick={() => selectMenu("getPersonData")}>Get Person</li>
        <li onClick={() => selectMenu("getEventId")}>Get Event</li>
        <li onClick={() => selectMenu("getVisitId")}>Get Visit Id</li>
      </ol>
    </div>
  );
};

export default List;
