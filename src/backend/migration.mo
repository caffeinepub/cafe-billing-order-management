import List "mo:core/List";
import Array "mo:core/Array";

module {
  type OrderItem = {
    menuItemId : Text;
    name : Text;
    price : Nat;
    quantity : Nat;
  };

  type Order = {
    id : Text;
    orderNumber : Text;
    dateTime : Text;
    items : [OrderItem];
    total : Nat;
    paymentType : Text;
  };

  type MenuItem = {
    id : Text;
    name : Text;
    price : Nat;
  };

  type Category = {
    id : Text;
    name : Text;
    items : [MenuItem];
  };

  type OldActor = {
    orders : List.List<Order>;
    menu : [Category];
    orderCounter : Nat;
  };
  type NewActor = {
    orders : [Order];
    menu : [Category];
    counter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      orders = old.orders.toArray();
      menu = old.menu;
      counter = old.orderCounter;
    };
  };
};
