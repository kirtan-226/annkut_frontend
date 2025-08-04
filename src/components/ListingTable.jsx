import React from "react";
import { Table } from "reactstrap";
import { FaTrash } from "react-icons/fa";

const ListingTable = ({ data, handleDelete }) => {
  return (
    <div>
      <Table striped>
        <thead>
          <tr>
            <th>Sr.</th>
            <th>Book no.</th>
            <th>Receipt no.</th>
            <th>Amount</th>
            <th>Name</th>
            {/* <th>Action</th> */}
          </tr>
        </thead>
        <tbody>
          {data?.map((item, index) => (
            <tr key={item.id}>
              <th scope="row">{index + 1}</th>
              <td>{item.book_no}</td>
              <td>{item.reciept_no}</td>
              <td>{item.seva_amount}</td>
              <td>{item.sahyogi_name || "-"}</td>
              {/* <td>
                                <FaTrash
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleDelete(item.id)} // Call handleDelete with the item's ID
                                />
                            </td> */}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ListingTable;
